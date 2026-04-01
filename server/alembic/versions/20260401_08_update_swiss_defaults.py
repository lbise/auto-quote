"""update seeded defaults for swiss market"""

from alembic import op


revision = "20260401_08"
down_revision = "20260401_07"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "UPDATE settings SET default_currency = 'CHF' "
        "WHERE business_name IN ('AutoQuote Demo', 'Atelier Couleurs', 'Bois & Mesure', 'Courant Clair') "
        "AND default_currency IN ('EUR', 'USD')"
    )
    op.execute(
        "UPDATE settings SET default_tax_rate = 0.077 "
        "WHERE business_name IN ('AutoQuote Demo', 'Atelier Couleurs', 'Bois & Mesure', 'Courant Clair') "
        "AND default_tax_rate = 0.2"
    )
    op.execute(
        "UPDATE settings SET business_email = 'demo@autoquote.ch', business_phone = '+41 21 555 01 02', "
        "business_address = 'Rue du Simplon 24\n1006 Lausanne' "
        "WHERE business_name = 'AutoQuote Demo' AND business_email = 'demo@autoquote.test'"
    )
    op.execute(
        "UPDATE settings SET business_email = 'contact@atelier-couleurs.ch', business_phone = '+41 22 555 11 22', "
        "business_address = 'Route de Carouge 18\n1227 Carouge GE' "
        "WHERE business_name = 'Atelier Couleurs' AND business_email = 'contact@atelier-couleurs.test'"
    )
    op.execute(
        "UPDATE settings SET business_email = 'contact@bois-mesure.ch', business_phone = '+41 21 555 31 41', "
        "business_address = 'Chemin des Menuisiers 4\n1024 Ecublens VD' "
        "WHERE business_name = 'Bois & Mesure' AND business_email = 'contact@bois-mesure.test'"
    )
    op.execute(
        "UPDATE settings SET business_email = 'contact@courant-clair.ch', business_phone = '+41 32 555 41 51', "
        "business_address = 'Avenue de la Gare 27\n2000 Neuchatel' "
        "WHERE business_name = 'Courant Clair' AND business_email = 'contact@courant-clair.test'"
    )


def downgrade() -> None:
    op.execute(
        "UPDATE settings SET default_currency = 'EUR' "
        "WHERE business_name IN ('AutoQuote Demo', 'Atelier Couleurs', 'Bois & Mesure', 'Courant Clair') "
        "AND default_currency = 'CHF'"
    )
    op.execute(
        "UPDATE settings SET default_tax_rate = 0.2 "
        "WHERE business_name IN ('AutoQuote Demo', 'Atelier Couleurs', 'Bois & Mesure', 'Courant Clair') "
        "AND default_tax_rate = 0.077"
    )
    op.execute(
        "UPDATE settings SET business_email = 'demo@autoquote.test', business_phone = '+33 6 10 20 30 40', "
        "business_address = '12 rue de la Demo\n33000 Bordeaux' WHERE business_name = 'AutoQuote Demo'"
    )
    op.execute(
        "UPDATE settings SET business_email = 'contact@atelier-couleurs.test', business_phone = '+33 6 11 22 33 44', "
        "business_address = '18 avenue des Artisans\n44000 Nantes' WHERE business_name = 'Atelier Couleurs'"
    )
    op.execute(
        "UPDATE settings SET business_email = 'contact@bois-mesure.test', business_phone = '+33 6 21 31 41 51', "
        "business_address = '4 impasse des Menuisiers\n69000 Lyon' WHERE business_name = 'Bois & Mesure'"
    )
    op.execute(
        "UPDATE settings SET business_email = 'contact@courant-clair.test', business_phone = '+33 6 31 41 51 61', "
        "business_address = '27 boulevard Edison\n59000 Lille' WHERE business_name = 'Courant Clair'"
    )
