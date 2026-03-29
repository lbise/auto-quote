from __future__ import annotations

import json
import re
from functools import lru_cache
from pathlib import Path
from typing import Any
from urllib import error, request

from app.core.config import ROOT_DIR, get_settings
from app.models.quote import Quote
from app.models.settings import AppSettings
from app.schemas.chat import AssistantReply
from app.schemas.quotes import QuoteUpdate


PROMPT_PATH = ROOT_DIR / "server" / "app" / "prompts" / "quote_assistant.md"


@lru_cache
def load_system_prompt() -> str:
    return PROMPT_PATH.read_text(encoding="utf-8").strip()


def generate_assistant_reply(
    *,
    quote: Quote,
    business_settings: AppSettings,
    conversation: list[dict[str, Any]],
) -> AssistantReply:
    settings = get_settings()
    mode = settings.llm_mode.lower()

    if mode == "openai" or (mode == "auto" and settings.openai_api_key):
        return _generate_openai_reply(
            quote=quote,
            business_settings=business_settings,
            conversation=conversation,
        )

    return _generate_mock_reply(
        quote=quote,
        business_settings=business_settings,
        conversation=conversation,
    )


def _generate_openai_reply(
    *,
    quote: Quote,
    business_settings: AppSettings,
    conversation: list[dict[str, Any]],
) -> AssistantReply:
    settings = get_settings()
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY is required when llm_mode is set to openai.")

    payload = {
        "model": settings.openai_model,
        "temperature": 0.2,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": load_system_prompt()},
            {
                "role": "user",
                "content": json.dumps(
                    {
                        "locale": quote.locale,
                        "business_defaults": {
                            "business_name": business_settings.business_name,
                            "default_currency": business_settings.default_currency,
                            "default_payment_terms": business_settings.default_payment_terms,
                            "default_tax_rate": float(business_settings.default_tax_rate),
                            "default_validity_days": business_settings.default_validity_days,
                        },
                        "quote": _serialize_quote(quote),
                        "conversation": conversation,
                    },
                    ensure_ascii=False,
                ),
            },
        ],
    }

    base_url = (settings.openai_base_url or "https://api.openai.com/v1").rstrip("/")
    req = request.Request(
        url=f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=settings.llm_timeout_seconds) as response:
            data = json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:  # pragma: no cover - network error path
        detail = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"OpenAI request failed: {detail or exc.reason}") from exc
    except error.URLError as exc:  # pragma: no cover - network error path
        raise RuntimeError(f"OpenAI request failed: {exc.reason}") from exc

    content = data["choices"][0]["message"]["content"]
    return AssistantReply.model_validate(json.loads(content))


def _generate_mock_reply(
    *,
    quote: Quote,
    business_settings: AppSettings,
    conversation: list[dict[str, Any]],
) -> AssistantReply:
    locale = quote.locale or business_settings.default_locale or "fr"
    latest_user_message = next(
        (message["content"] for message in reversed(conversation) if message["role"] == "user"),
        "",
    ).strip()

    patch_data: dict[str, Any] = {}

    if latest_user_message:
        customer_fields = _extract_customer_fields(latest_user_message, locale)
        if customer_fields and not quote.customer_name and not quote.customer_company:
            patch_data.update(customer_fields)

        if not quote.title:
            patch_data["title"] = _build_title(latest_user_message, locale)

        if not quote.job_summary:
            patch_data["job_summary"] = latest_user_message

        if not quote.line_items:
            patch_data["line_items"] = [
                {
                    "description": _build_line_item_description(latest_user_message, locale),
                    "quantity": 1,
                    "unit": "forfait" if locale == "fr" else "job",
                    "unit_price_cents": None,
                    "needs_review": True,
                    "source": "ai",
                }
            ]

        price_cents = _extract_money_cents(latest_user_message)
        if price_cents is not None and quote.line_items and any(
            item.unit_price_cents is None or item.needs_review for item in quote.line_items
        ):
            patch_data["line_items"] = [
                {
                    "description": item.description,
                    "quantity": float(item.quantity),
                    "unit": item.unit,
                    "unit_price_cents": price_cents if index == 0 else item.unit_price_cents,
                    "needs_review": False if index == 0 else item.needs_review,
                    "source": item.source,
                }
                for index, item in enumerate(quote.line_items)
            ]

    customer_missing_after_patch = not (
        quote.customer_name
        or quote.customer_company
        or patch_data.get("customer_name")
        or patch_data.get("customer_company")
    )

    if customer_missing_after_patch:
        if patch_data:
            return AssistantReply(
                action="update_quote",
                assistant_message=(
                    "J'ai préparé une première structure du devis et laissé le prix à revoir. Quel nom de client ou d'entreprise dois-je afficher ?"
                    if locale == "fr"
                    else "I drafted the first quote structure and left pricing for review. What customer or company name should appear on the quote?"
                ),
                quote_patch=QuoteUpdate.model_validate(patch_data),
            )

        return AssistantReply(
            action="ask_question",
            assistant_message=(
                "Quel nom de client ou d'entreprise doit apparaître sur le devis ?"
                if locale == "fr"
                else "What customer or company name should appear on the quote?"
            ),
        )

    if patch_data:
        patched_line_items = patch_data.get("line_items")
        current_pricing_incomplete = any(
            item.unit_price_cents is None or item.needs_review for item in quote.line_items
        )
        pricing_still_incomplete = bool(
            patched_line_items
            and any(
                item.get("unit_price_cents") is None or item.get("needs_review")
                for item in patched_line_items
            )
        ) or (not patched_line_items and current_pricing_incomplete)

        return AssistantReply(
            action="update_quote",
            assistant_message=(
                "J'ai mis à jour le brouillon et laissé le prix à revoir. Quel montant dois-je utiliser pour cette prestation principale ?"
                if locale == "fr" and pricing_still_incomplete
                else "J'ai mis à jour le brouillon. Dites-moi le prochain détail à ajouter."
                if locale == "fr"
                else "I updated the draft and left pricing for review. What amount should I use for the main service line?"
                if pricing_still_incomplete
                else "I updated the draft. Tell me the next detail you want to add."
            ),
            quote_patch=QuoteUpdate.model_validate(patch_data),
        )

    if quote.line_items and any(item.unit_price_cents is None or item.needs_review for item in quote.line_items):
        line_label = quote.line_items[0].description or (
            "la prestation principale" if locale == "fr" else "the main service"
        )
        return AssistantReply(
            action="ask_question",
            assistant_message=(
                f"Quel prix dois-je utiliser pour {line_label} ?"
                if locale == "fr"
                else f"What price should I use for {line_label}?"
            ),
        )

    return AssistantReply(
        action="ask_question",
        assistant_message=(
            "Parfait. Quel detail supplementaire dois-je ajouter avant de preparer une version prete a envoyer ?"
            if locale == "fr"
            else "Great. What extra detail should I add before I prepare a version that is ready to send?"
        ),
    )


def _serialize_quote(quote: Quote) -> dict[str, Any]:
    return {
        "quote_number": quote.quote_number,
        "status": quote.status,
        "locale": quote.locale,
        "customer_name": quote.customer_name,
        "customer_company": quote.customer_company,
        "customer_email": quote.customer_email,
        "customer_phone": quote.customer_phone,
        "customer_address": quote.customer_address,
        "title": quote.title,
        "job_summary": quote.job_summary,
        "assumptions": quote.assumptions,
        "notes": quote.notes,
        "payment_terms": quote.payment_terms,
        "currency": quote.currency,
        "tax_rate": float(quote.tax_rate),
        "valid_until": quote.valid_until.isoformat(),
        "line_items": [
            {
                "description": item.description,
                "quantity": float(item.quantity),
                "unit": item.unit,
                "unit_price_cents": item.unit_price_cents,
                "needs_review": item.needs_review,
            }
            for item in quote.line_items
        ],
    }


def _build_title(message: str, locale: str) -> str:
    cleaned = message.strip().rstrip(".?!")
    if not cleaned:
        return "Nouveau devis" if locale == "fr" else "New quote"

    base = cleaned[:70]
    prefix = "Devis - " if locale == "fr" else "Quote - "
    return f"{prefix}{base}"


def _build_line_item_description(message: str, locale: str) -> str:
    if locale == "fr":
        return f"Prestation principale - {message[:100]}" if message else "Prestation principale"
    return f"Primary service - {message[:100]}" if message else "Primary service"


def _extract_customer_fields(message: str, locale: str) -> dict[str, str] | None:
    cleaned = re.sub(r"\s+", " ", message.strip()).strip(" .,!?")
    if not cleaned or any(char.isdigit() for char in cleaned):
        return None

    if len(cleaned.split()) > 8:
        return None

    company_markers = {"inc", "llc", "ltd", "studio", "company", "corp", "sarl", "sas"}
    lower_words = {word.lower() for word in cleaned.split()}
    if lower_words & company_markers or len(cleaned.split()) > 2:
        return {"customer_company": cleaned}

    return {"customer_name": cleaned}


def _extract_money_cents(message: str) -> int | None:
    match = re.search(r"(\d+[\d\s,.]*)", message)
    if not match:
        return None

    normalized = match.group(1).replace(" ", "").replace(",", ".")
    try:
        return round(float(normalized) * 100)
    except ValueError:
        return None
