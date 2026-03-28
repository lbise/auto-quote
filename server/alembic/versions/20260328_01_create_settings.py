"""create settings table"""

from alembic import op
import sqlalchemy as sa


revision = "20260328_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "settings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("business_email", sa.String(length=255), nullable=True),
        sa.Column("business_phone", sa.String(length=50), nullable=False, server_default=""),
        sa.Column("business_address", sa.Text(), nullable=False, server_default=""),
        sa.Column("default_currency", sa.String(length=8), nullable=False, server_default="USD"),
        sa.Column("default_tax_rate", sa.Numeric(5, 4), nullable=False, server_default="0"),
        sa.Column(
            "default_payment_terms",
            sa.Text(),
            nullable=False,
            server_default="Payment due on receipt",
        ),
        sa.Column("default_validity_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("settings")
