"""create quotes and quote line items"""

from alembic import op
import sqlalchemy as sa


revision = "20260328_02"
down_revision = "20260328_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quotes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("quote_number", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft"),
        sa.Column("customer_name", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("customer_company", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("customer_email", sa.String(length=255), nullable=True),
        sa.Column("customer_phone", sa.String(length=50), nullable=False, server_default=""),
        sa.Column("customer_address", sa.Text(), nullable=False, server_default=""),
        sa.Column("title", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("job_summary", sa.Text(), nullable=False, server_default=""),
        sa.Column("assumptions", sa.Text(), nullable=False, server_default=""),
        sa.Column("notes", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "payment_terms",
            sa.Text(),
            nullable=False,
            server_default="Payment due on receipt",
        ),
        sa.Column("currency", sa.String(length=8), nullable=False, server_default="USD"),
        sa.Column("subtotal_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tax_rate", sa.Numeric(5, 4), nullable=False, server_default="0"),
        sa.Column("tax_amount_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("total_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pricing_complete", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("valid_until", sa.Date(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_quotes_quote_number"), "quotes", ["quote_number"], unique=True)

    op.create_table(
        "quote_line_items",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("quote_id", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False, server_default="1"),
        sa.Column("unit", sa.String(length=32), nullable=False, server_default="job"),
        sa.Column("unit_price_cents", sa.Integer(), nullable=True),
        sa.Column("line_total_cents", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("needs_review", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("source", sa.String(length=16), nullable=False, server_default="manual"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.ForeignKeyConstraint(["quote_id"], ["quotes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_quote_line_items_quote_id"),
        "quote_line_items",
        ["quote_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_quote_line_items_quote_id"), table_name="quote_line_items")
    op.drop_table("quote_line_items")
    op.drop_index(op.f("ix_quotes_quote_number"), table_name="quotes")
    op.drop_table("quotes")
