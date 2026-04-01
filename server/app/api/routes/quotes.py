from fastapi import APIRouter, Body, Depends, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.chat import QuoteChatRequest, QuoteChatResponse
from app.schemas.quotes import QuoteCreate, QuoteListItem, QuoteRead, QuoteUpdate
from app.services.chat_service import handle_quote_chat
from app.services.quote_service import create_quote, delete_quote, get_quote, list_quotes, update_quote


router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.get("", response_model=list[QuoteListItem])
def read_quotes(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[QuoteListItem]:
    quotes = list_quotes(db, current_user.id)
    return [
        QuoteListItem(
            id=quote.id,
            quote_number=quote.quote_number,
            status=quote.status,
            customer_name=quote.customer_name,
            customer_company=quote.customer_company,
            locale=quote.locale,
            title=quote.title,
            currency=quote.currency,
            total_cents=quote.total_cents,
            pricing_complete=quote.pricing_complete,
            item_count=len(quote.line_items),
            updated_at=quote.updated_at,
        )
        for quote in quotes
    ]


@router.post("", response_model=QuoteRead, status_code=status.HTTP_201_CREATED)
def create_quote_route(
    payload: QuoteCreate | None = Body(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuoteRead:
    quote = create_quote(db, current_user.id, payload or QuoteCreate())
    return QuoteRead.model_validate(quote)


@router.get("/{quote_id}", response_model=QuoteRead)
def read_quote(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuoteRead:
    quote = get_quote(db, current_user.id, quote_id)
    return QuoteRead.model_validate(quote)


@router.patch("/{quote_id}", response_model=QuoteRead)
def patch_quote(
    quote_id: int,
    payload: QuoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuoteRead:
    quote = update_quote(db, current_user.id, quote_id, payload)
    return QuoteRead.model_validate(quote)


@router.delete("/{quote_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quote_route(
    quote_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    delete_quote(db, current_user.id, quote_id)


@router.post("/{quote_id}/chat", response_model=QuoteChatResponse)
def chat_on_quote(
    quote_id: int,
    payload: QuoteChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> QuoteChatResponse:
    assistant_reply, quote = handle_quote_chat(db, current_user, quote_id, payload)
    return QuoteChatResponse(
        action=assistant_reply.action,
        assistant_message=assistant_reply.assistant_message,
        quote=quote,
    )
