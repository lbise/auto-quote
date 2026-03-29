"""create quote messages"""

from alembic import op
import sqlalchemy as sa


revision = "20260328_05"
down_revision = "20260328_04"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "quote_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("quote_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=20), nullable=False, server_default="user"),
        sa.Column("content", sa.Text(), nullable=False, server_default=""),
        sa.Column("assistant_action", sa.String(length=20), nullable=True),
        sa.Column("quote_patch_json", sa.JSON(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.ForeignKeyConstraint(["quote_id"], ["quotes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_quote_messages_quote_id"),
        "quote_messages",
        ["quote_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_quote_messages_quote_id"), table_name="quote_messages")
    op.drop_table("quote_messages")
