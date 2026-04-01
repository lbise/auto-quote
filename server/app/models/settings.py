from datetime import datetime
from typing import Any

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class AppSettings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, unique=True)
    business_name: Mapped[str] = mapped_column(String(255), default="")
    business_email: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    business_phone: Mapped[str] = mapped_column(String(50), default="")
    business_address: Mapped[str] = mapped_column(Text, default="")
    default_locale: Mapped[str] = mapped_column(String(5), default="fr")
    default_currency: Mapped[str] = mapped_column(String(8), default="CHF")
    default_tax_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0.077)
    default_payment_terms: Mapped[str] = mapped_column(Text, default="Paiement à réception")
    default_validity_days: Mapped[int] = mapped_column(Integer, default=30)
    priced_items: Mapped[list[dict[str, Any]]] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="settings")
