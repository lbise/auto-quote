from datetime import date, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.quote import Quote
from app.models.quote_line_item import QuoteLineItem
from app.schemas.quotes import QuoteCreate, QuoteLineItemInput, QuoteUpdate
from app.services.quote_engine import recalculate_quote
from app.services.settings_service import get_or_create_settings


def _quote_query():
    return select(Quote).options(selectinload(Quote.line_items), selectinload(Quote.messages))


def list_quotes(db: Session, user_id: int) -> list[Quote]:
    statement = _quote_query().where(Quote.user_id == user_id).order_by(Quote.updated_at.desc(), Quote.id.desc())
    return list(db.scalars(statement).unique().all())


def get_quote(db: Session, user_id: int, quote_id: int) -> Quote:
    statement = _quote_query().where(Quote.id == quote_id, Quote.user_id == user_id)
    quote = db.scalar(statement)

    if quote is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quote not found")

    return quote


def _next_quote_number(db: Session) -> str:
    quote_count = db.scalar(select(func.count(Quote.id))) or 0
    return f"AQ-{quote_count + 1:04d}"


def _build_line_item(payload: QuoteLineItemInput, index: int) -> QuoteLineItem:
    return QuoteLineItem(
        description=payload.description.strip(),
        quantity=payload.quantity,
        unit=payload.unit.strip() or "job",
        unit_price_cents=payload.unit_price_cents,
        needs_review=payload.needs_review,
        source=payload.source,
        sort_order=index,
    )


def create_quote(db: Session, user_id: int, payload: QuoteCreate) -> Quote:
    settings = get_or_create_settings(db, user_id)

    quote = Quote(
        user_id=user_id,
        quote_number=_next_quote_number(db),
        status=payload.status,
        customer_name=payload.customer_name.strip(),
        customer_company=payload.customer_company.strip(),
        customer_email=payload.customer_email,
        customer_phone=payload.customer_phone.strip(),
        customer_address=payload.customer_address.strip(),
        locale=(payload.locale or settings.default_locale).strip().lower(),
        title=payload.title.strip(),
        job_summary=payload.job_summary.strip(),
        assumptions=payload.assumptions.strip(),
        notes=payload.notes.strip(),
        payment_terms=(payload.payment_terms or settings.default_payment_terms).strip(),
        currency=(payload.currency or settings.default_currency).strip().upper(),
        tax_rate=payload.tax_rate if payload.tax_rate is not None else settings.default_tax_rate,
        valid_until=payload.valid_until or date.today() + timedelta(days=settings.default_validity_days),
        line_items=[_build_line_item(item, index) for index, item in enumerate(payload.line_items)],
    )

    recalculate_quote(quote)
    db.add(quote)
    db.commit()
    return get_quote(db, user_id, quote.id)


def update_quote(db: Session, user_id: int, quote_id: int, payload: QuoteUpdate) -> Quote:
    quote = get_quote(db, user_id, quote_id)
    updates = payload.model_dump(exclude_unset=True, exclude={"line_items"})

    for field, value in updates.items():
        if isinstance(value, str):
            value = value.strip()
        if field == "currency" and isinstance(value, str):
            value = value.upper()
        if field == "locale" and isinstance(value, str):
            value = value.lower()
        setattr(quote, field, value)

    if payload.line_items is not None:
        quote.line_items.clear()
        quote.line_items.extend(
            _build_line_item(item, index) for index, item in enumerate(payload.line_items)
        )

    recalculate_quote(quote)
    db.add(quote)
    db.commit()
    return get_quote(db, user_id, quote.id)


def delete_quote(db: Session, user_id: int, quote_id: int) -> None:
    quote = get_quote(db, user_id, quote_id)
    db.delete(quote)
    db.commit()
