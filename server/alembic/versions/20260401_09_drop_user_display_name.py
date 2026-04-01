"""drop unused user display name"""

from alembic import op
import sqlalchemy as sa


revision = "20260401_09"
down_revision = "20260401_08"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.drop_column("display_name")


def downgrade() -> None:
    with op.batch_alter_table("users") as batch_op:
        batch_op.add_column(sa.Column("display_name", sa.String(length=120), nullable=False, server_default=""))
