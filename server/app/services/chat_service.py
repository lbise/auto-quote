from __future__ import annotations

from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.quote_message import QuoteMessage
from app.schemas.chat import AssistantReply, QuoteChatRequest
from app.schemas.quotes import QuoteRead, QuoteUpdate
from app.services.llm_service import (
    LLMConfigurationError,
    LLMProviderError,
    LLMResponseError,
    generate_assistant_reply,
)
from app.services.quote_service import get_quote, update_quote
from app.services.settings_service import get_or_create_settings


def add_quote_message(
    db: Session,
    *,
    quote_id: int,
    role: str,
    content: str,
    assistant_action: str | None = None,
    quote_patch_json: dict[str, Any] | None = None,
) -> QuoteMessage:
    message = QuoteMessage(
        quote_id=quote_id,
        role=role,
        content=content.strip(),
        assistant_action=assistant_action,
        quote_patch_json=quote_patch_json,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def handle_quote_chat(db: Session, quote_id: int, payload: QuoteChatRequest) -> tuple[AssistantReply, Any]:
    message_text = payload.message.strip()
    if not message_text:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Message cannot be empty")

    quote = get_quote(db, quote_id)
    settings = get_or_create_settings(db)
    conversation = [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in quote.messages
    ] + [{"role": "user", "content": message_text}]

    try:
        assistant_reply = generate_assistant_reply(
            quote=quote,
            business_settings=settings,
            conversation=conversation,
        )
    except LLMConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    except LLMProviderError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc
    except LLMResponseError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    add_quote_message(db, quote_id=quote_id, role="user", content=message_text)

    quote_patch_json = (
        assistant_reply.quote_patch.model_dump(exclude_unset=True)
        if assistant_reply.quote_patch is not None
        else None
    )

    if assistant_reply.action == "update_quote" and quote_patch_json:
        quote = update_quote(db, quote_id, QuoteUpdate.model_validate(quote_patch_json))
    else:
        quote = get_quote(db, quote_id)

    add_quote_message(
        db,
        quote_id=quote_id,
        role="assistant",
        content=assistant_reply.assistant_message,
        assistant_action=assistant_reply.action,
        quote_patch_json=quote_patch_json,
    )

    quote = get_quote(db, quote_id)
    return assistant_reply, QuoteRead.model_validate(quote)
