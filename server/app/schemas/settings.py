from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.schemas.priced_items import PricedItem


LocaleCode = Literal["fr", "en"]


class SettingsBase(BaseModel):
    business_name: str = ""
    business_email: EmailStr | None = None
    business_phone: str = ""
    business_address: str = ""
    default_locale: LocaleCode = "fr"
    default_currency: str = Field(default="CHF", min_length=3, max_length=8)
    default_tax_rate: float = Field(default=0.077, ge=0, le=1)
    default_payment_terms: str = "Paiement à réception"
    default_validity_days: int = Field(default=30, ge=1, le=365)
    priced_items: list[PricedItem] = Field(default_factory=list)


class SettingsUpdate(BaseModel):
    business_name: str | None = None
    business_email: EmailStr | None = None
    business_phone: str | None = None
    business_address: str | None = None
    default_locale: LocaleCode | None = None
    default_currency: str | None = Field(default=None, min_length=3, max_length=8)
    default_tax_rate: float | None = Field(default=None, ge=0, le=1)
    default_payment_terms: str | None = None
    default_validity_days: int | None = Field(default=None, ge=1, le=365)
    priced_items: list[PricedItem] | None = None


class SettingsRead(SettingsBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    updated_at: datetime
