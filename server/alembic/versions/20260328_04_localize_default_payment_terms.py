"""localize stock payment terms to French defaults"""

from alembic import op


revision = "20260328_04"
down_revision = "20260328_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "UPDATE settings SET default_payment_terms = 'Paiement à réception' "
        "WHERE default_payment_terms = 'Payment due on receipt'"
    )
    op.execute(
        "UPDATE quotes SET payment_terms = 'Paiement à réception' "
        "WHERE payment_terms = 'Payment due on receipt'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE settings SET default_payment_terms = 'Payment due on receipt' "
        "WHERE default_payment_terms = 'Paiement à réception'"
    )
    op.execute(
        "UPDATE quotes SET payment_terms = 'Payment due on receipt' "
        "WHERE payment_terms = 'Paiement à réception'"
    )
