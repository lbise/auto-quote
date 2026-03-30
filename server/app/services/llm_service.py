from __future__ import annotations

import json
import logging
from functools import lru_cache
from typing import Any
from urllib import error, request

from pydantic import ValidationError

from app.core.config import ROOT_DIR, get_settings
from app.models.quote import Quote
from app.models.settings import AppSettings
from app.schemas.chat import AssistantReply


logger = logging.getLogger(__name__)
PROMPT_PATH = ROOT_DIR / "server" / "app" / "prompts" / "quote_assistant.md"


class LLMError(RuntimeError):
    pass


class LLMConfigurationError(LLMError):
    pass


class LLMProviderError(LLMError):
    pass


class LLMResponseError(LLMError):
    pass


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

    if mode not in {"openai", "auto"}:
        raise LLMConfigurationError(
            f"Unsupported LLM_MODE '{settings.llm_mode}'. Use 'openai' for Gemini's OpenAI-compatible API."
        )

    if not settings.openai_api_key:
        raise LLMConfigurationError(
            "LLM is not configured. Set OPENAI_API_KEY, OPENAI_BASE_URL, and OPENAI_MODEL before using chat."
        )

    return _generate_openai_reply(
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

    if "generativelanguage.googleapis.com" in base_url and (
        "/models/" in base_url or ":generateContent" in base_url
    ):
        raise LLMConfigurationError(
            "Gemini OpenAI-compatible mode expects OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai"
        )

    endpoint = f"{base_url}/chat/completions"
    req = request.Request(
        url=endpoint,
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
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="ignore")
        logger.warning(
            "LLM provider HTTP error model=%s endpoint=%s status=%s body=%s",
            settings.openai_model,
            endpoint,
            exc.code,
            detail[:1000],
        )
        raise LLMProviderError(
            f"LLM provider request failed with status {exc.code}. Check OPENAI_BASE_URL, OPENAI_MODEL, and your API key."
        ) from exc
    except error.URLError as exc:
        logger.warning(
            "LLM provider network error model=%s endpoint=%s reason=%s",
            settings.openai_model,
            endpoint,
            exc.reason,
        )
        raise LLMProviderError(
            "LLM provider request failed. Check network access and OPENAI_BASE_URL."
        ) from exc
    except TimeoutError as exc:
        logger.warning(
            "LLM provider timeout model=%s endpoint=%s timeout=%s",
            settings.openai_model,
            endpoint,
            settings.llm_timeout_seconds,
        )
        raise LLMProviderError(
            "LLM provider request timed out. Try again or increase LLM_TIMEOUT_SECONDS."
        ) from exc

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        logger.warning(
            "LLM response missing content model=%s payload=%s",
            settings.openai_model,
            json.dumps(data, ensure_ascii=False)[:1000],
        )
        raise LLMResponseError(
            "LLM returned an unexpected response structure."
        ) from exc

    if not isinstance(content, str) or not content.strip():
        logger.warning("LLM response content empty model=%s content=%r", settings.openai_model, content)
        raise LLMResponseError("LLM returned an empty response.")

    json_text = _extract_json_text(content)

    try:
        parsed = json.loads(json_text)
    except json.JSONDecodeError as exc:
        logger.warning(
            "LLM response invalid JSON model=%s content=%s",
            settings.openai_model,
            json_text[:1000],
        )
        raise LLMResponseError(
            "LLM returned invalid JSON. Adjust the prompt or model settings and try again."
        ) from exc

    try:
        return AssistantReply.model_validate(parsed)
    except ValidationError as exc:
        logger.warning(
            "LLM response failed schema validation model=%s errors=%s payload=%s",
            settings.openai_model,
            exc.errors(),
            json.dumps(parsed, ensure_ascii=False)[:1000],
        )
        raise LLMResponseError(
            "LLM returned data that does not match the expected quote schema."
        ) from exc


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


def _extract_json_text(content: str) -> str:
    stripped = content.strip()

    if stripped.startswith("```"):
        lines = stripped.splitlines()
        if lines and lines[0].startswith("```"):
            lines = lines[1:]
        if lines and lines[-1].startswith("```"):
            lines = lines[:-1]
        stripped = "\n".join(lines).strip()

    return stripped
