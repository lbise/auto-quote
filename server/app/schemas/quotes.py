from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


QuoteStatus = Literal["draft", "ready", "sent"]
LineItemSource = Literal["manual", "ai"]
LocaleCode = Literal["fr", "en"]


class QuoteLineItemInput(BaseModel):
    description: str = ""
    quantity: float = Field(default=1, ge=0)
    unit: str = Field(default="job", min_length=1, max_length=32)
    unit_price_cents: int | None = Field(default=None, ge=0)
    needs_review: bool = False
    source: LineItemSource = "manual"


class QuoteLineItemRead(QuoteLineItemInput):
    model_config = ConfigDict(from_attributes=True)

    id: int
    line_total_cents: int
    sort_order: int


class QuoteBase(BaseModel):
    status: QuoteStatus = "draft"
    customer_name: str = ""
    customer_company: str = ""
    customer_email: EmailStr | None = None
    customer_phone: str = ""
    customer_address: str = ""
    locale: LocaleCode = "fr"
    title: str = ""
    job_summary: str = ""
    assumptions: str = ""
    notes: str = ""
    payment_terms: str = "Paiement à réception"
    currency: str = Field(default="USD", min_length=3, max_length=8)
    tax_rate: float = Field(default=0, ge=0, le=1)
    valid_until: date | None = None


class QuoteCreate(BaseModel):
    status: QuoteStatus = "draft"
    customer_name: str = ""
    customer_company: str = ""
    customer_email: EmailStr | None = None
    customer_phone: str = ""
    customer_address: str = ""
    locale: LocaleCode | None = None
    title: str = ""
    job_summary: str = ""
    assumptions: str = ""
    notes: str = ""
    payment_terms: str | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=8)
    tax_rate: float | None = Field(default=None, ge=0, le=1)
    valid_until: date | None = None
    line_items: list[QuoteLineItemInput] = Field(default_factory=list)


class QuoteUpdate(BaseModel):
    status: QuoteStatus | None = None
    customer_name: str | None = None
    customer_company: str | None = None
    customer_email: EmailStr | None = None
    customer_phone: str | None = None
    customer_address: str | None = None
    locale: LocaleCode | None = None
    title: str | None = None
    job_summary: str | None = None
    assumptions: str | None = None
    notes: str | None = None
    payment_terms: str | None = None
    currency: str | None = Field(default=None, min_length=3, max_length=8)
    tax_rate: float | None = Field(default=None, ge=0, le=1)
    valid_until: date | None = None
    line_items: list[QuoteLineItemInput] | None = None


class QuoteRead(QuoteBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quote_number: str
    subtotal_cents: int
    tax_amount_cents: int
    total_cents: int
    pricing_complete: bool
    line_items: list[QuoteLineItemRead]
    created_at: datetime
    updated_at: datetime


class QuoteListItem(BaseModel):
    id: int
    quote_number: str
    status: QuoteStatus
    customer_name: str
    customer_company: str
    locale: LocaleCode
    title: str
    currency: str
    total_cents: int
    pricing_complete: bool
    item_count: int
    updated_at: datetime
