from datetime import datetime

from sqlalchemy import DateTime, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class AppSettings(Base):
    __tablename__ = "settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    business_name: Mapped[str] = mapped_column(String(255), default="")
    business_email: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    business_phone: Mapped[str] = mapped_column(String(50), default="")
    business_address: Mapped[str] = mapped_column(Text, default="")
    default_locale: Mapped[str] = mapped_column(String(5), default="fr")
    default_currency: Mapped[str] = mapped_column(String(8), default="USD")
    default_tax_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0)
    default_payment_terms: Mapped[str] = mapped_column(Text, default="Paiement à réception")
    default_validity_days: Mapped[int] = mapped_column(Integer, default=30)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
