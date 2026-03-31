from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


PricingMode = Literal["fixed", "area_rectangle", "volume_direct"]


class PricedItem(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    name: str = Field(min_length=1, max_length=120)
    description: str = ""
    pricing_mode: PricingMode = "fixed"
    unit: str = Field(default="job", min_length=1, max_length=32)
    unit_price_cents: int = Field(ge=0)
    default_quantity: float = Field(default=1, gt=0)
    is_active: bool = True

    @field_validator("id", "name", "description", "unit", mode="before")
    @classmethod
    def strip_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def apply_mode_defaults(self) -> "PricedItem":
        if self.pricing_mode == "area_rectangle":
            self.unit = "m2"
            self.default_quantity = 1
        elif self.pricing_mode == "volume_direct":
            self.unit = "l"
            self.default_quantity = 1
        elif not self.unit:
            self.unit = "job"

        return self
