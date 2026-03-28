"""add locale fields to settings and quotes"""

from alembic import op
import sqlalchemy as sa


revision = "20260328_03"
down_revision = "20260328_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "settings",
        sa.Column("default_locale", sa.String(length=5), nullable=False, server_default="fr"),
    )
    op.add_column(
        "quotes",
        sa.Column("locale", sa.String(length=5), nullable=False, server_default="fr"),
    )

    op.execute(
        "UPDATE settings SET default_payment_terms = 'Paiement à réception' "
        "WHERE default_payment_terms = 'Payment due on receipt'"
    )
    op.execute(
        "UPDATE quotes SET payment_terms = 'Paiement à réception' "
        "WHERE payment_terms = 'Payment due on receipt'"
    )


def downgrade() -> None:
    op.drop_column("quotes", "locale")
    op.drop_column("settings", "default_locale")
