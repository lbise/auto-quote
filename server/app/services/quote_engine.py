from decimal import Decimal, ROUND_HALF_UP

from app.models.quote import Quote


def _to_decimal(value: float | int | Decimal | None) -> Decimal:
    if value is None:
        return Decimal("0")
    return Decimal(str(value))


def _to_cents(value: Decimal) -> int:
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def recalculate_quote(quote: Quote) -> Quote:
    subtotal_cents = 0
    pricing_complete = len(quote.line_items) > 0

    for item in quote.line_items:
        quantity = _to_decimal(item.quantity)

        if item.unit_price_cents is None:
            item.line_total_cents = 0
            item.needs_review = True
            pricing_complete = False
            continue

        item.line_total_cents = _to_cents(quantity * Decimal(item.unit_price_cents))
        subtotal_cents += item.line_total_cents

        if item.needs_review:
            pricing_complete = False

    tax_amount_cents = _to_cents(Decimal(subtotal_cents) * _to_decimal(quote.tax_rate))

    quote.subtotal_cents = subtotal_cents
    quote.tax_amount_cents = tax_amount_cents
    quote.total_cents = subtotal_cents + tax_amount_cents
    quote.pricing_complete = pricing_complete
    return quote
