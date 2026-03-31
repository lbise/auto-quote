"""add priced item catalog to settings"""

from alembic import op
import sqlalchemy as sa


revision = "20260331_06"
down_revision = "20260328_05"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "settings",
        sa.Column("priced_items", sa.JSON(), nullable=False, server_default="[]"),
    )

    with op.batch_alter_table("quote_line_items") as batch_op:
        batch_op.alter_column(
            "quantity",
            existing_type=sa.Numeric(10, 2),
            type_=sa.Numeric(10, 3),
            existing_nullable=False,
            existing_server_default="1",
        )


def downgrade() -> None:
    with op.batch_alter_table("quote_line_items") as batch_op:
        batch_op.alter_column(
            "quantity",
            existing_type=sa.Numeric(10, 3),
            type_=sa.Numeric(10, 2),
            existing_nullable=False,
            existing_server_default="1",
        )

    op.drop_column("settings", "priced_items")
