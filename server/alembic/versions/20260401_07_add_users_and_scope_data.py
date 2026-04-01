"""add users and scope settings and quotes"""

from alembic import op
import sqlalchemy as sa


revision = "20260401_07"
down_revision = "20260331_06"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=100), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False, server_default=""),
        sa.Column("trade", sa.String(length=64), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
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
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.execute("DELETE FROM quote_messages")
    op.execute("DELETE FROM quote_line_items")
    op.execute("DELETE FROM quotes")
    op.execute("DELETE FROM settings")

    with op.batch_alter_table("settings") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f("ix_settings_user_id"), ["user_id"], unique=True)
        batch_op.create_foreign_key("fk_settings_user_id_users", "users", ["user_id"], ["id"], ondelete="CASCADE")
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=False)

    with op.batch_alter_table("quotes") as batch_op:
        batch_op.add_column(sa.Column("user_id", sa.Integer(), nullable=True))
        batch_op.create_index(batch_op.f("ix_quotes_user_id"), ["user_id"], unique=False)
        batch_op.create_foreign_key("fk_quotes_user_id_users", "users", ["user_id"], ["id"], ondelete="CASCADE")
        batch_op.alter_column("user_id", existing_type=sa.Integer(), nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("quotes") as batch_op:
        batch_op.drop_constraint("fk_quotes_user_id_users", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_quotes_user_id"))
        batch_op.drop_column("user_id")

    with op.batch_alter_table("settings") as batch_op:
        batch_op.drop_constraint("fk_settings_user_id_users", type_="foreignkey")
        batch_op.drop_index(batch_op.f("ix_settings_user_id"))
        batch_op.drop_column("user_id")

    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
