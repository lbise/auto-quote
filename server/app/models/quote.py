from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.db import Base


class Quote(Base):
    __tablename__ = "quotes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    quote_number: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="draft")
    customer_name: Mapped[str] = mapped_column(String(255), default="")
    customer_company: Mapped[str] = mapped_column(String(255), default="")
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True, default=None)
    customer_phone: Mapped[str] = mapped_column(String(50), default="")
    customer_address: Mapped[str] = mapped_column(Text, default="")
    locale: Mapped[str] = mapped_column(String(5), default="fr")
    title: Mapped[str] = mapped_column(String(255), default="")
    job_summary: Mapped[str] = mapped_column(Text, default="")
    assumptions: Mapped[str] = mapped_column(Text, default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    payment_terms: Mapped[str] = mapped_column(Text, default="Paiement à réception")
    currency: Mapped[str] = mapped_column(String(8), default="USD")
    subtotal_cents: Mapped[int] = mapped_column(Integer, default=0)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 4), default=0)
    tax_amount_cents: Mapped[int] = mapped_column(Integer, default=0)
    total_cents: Mapped[int] = mapped_column(Integer, default=0)
    pricing_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    valid_until: Mapped[date] = mapped_column(Date)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    user: Mapped["User"] = relationship(back_populates="quotes")
    line_items: Mapped[list["QuoteLineItem"]] = relationship(
        back_populates="quote",
        cascade="all, delete-orphan",
        order_by="QuoteLineItem.sort_order",
    )
    messages: Mapped[list["QuoteMessage"]] = relationship(
        back_populates="quote",
        cascade="all, delete-orphan",
        order_by="QuoteMessage.id",
    )
