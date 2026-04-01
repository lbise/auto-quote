from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.passwords import hash_password
from app.models.settings import AppSettings
from app.models.user import User


DemoAccountSeed = dict[str, object]


def ensure_demo_users(db: Session) -> None:
    runtime_settings = get_settings()
    password = runtime_settings.demo_password or runtime_settings.app_password or "demo"
    existing_users = {
        user.username: user
        for user in db.scalars(select(User).where(User.username.in_([seed["username"] for seed in _demo_account_seeds()])))
    }
    changed = False

    for seed in _demo_account_seeds():
        username = seed["username"]
        user = existing_users.get(username)

        if user is None:
            user = User(
                username=username,
                password_hash=hash_password(password),
                trade=seed["trade"],
                is_active=True,
            )
            db.add(user)
            db.flush()
            changed = True

        settings = db.scalar(select(AppSettings).where(AppSettings.user_id == user.id))
        if settings is None:
            db.add(AppSettings(user_id=user.id, **seed["settings"]))
            changed = True

    if changed:
        db.commit()


def _demo_account_seeds() -> Sequence[DemoAccountSeed]:
    return [
        {
            "username": "demo",
            "trade": "general",
            "settings": {
                "business_name": "AutoQuote Demo",
                "business_email": "demo@autoquote.ch",
                "business_phone": "+41 21 555 01 02",
                "business_address": "Rue du Simplon 24\n1006 Lausanne",
                "default_locale": "fr",
                "default_currency": "CHF",
                "default_tax_rate": 0.077,
                "default_payment_terms": "Acompte de 30%, solde a reception du chantier",
                "default_validity_days": 30,
                "priced_items": [
                    _priced_item(
                        item_id="site-visit",
                        name="Visite technique",
                        description="Visite de reperage, prise de mesures et preparation du devis",
                        unit_price_cents=12000,
                    ),
                    _priced_item(
                        item_id="project-management",
                        name="Coordination de chantier",
                        description="Pilotage global du chantier et coordination des intervenants",
                        unit_price_cents=18000,
                    ),
                ],
            },
        },
        {
            "username": "painter",
            "trade": "painting",
            "settings": {
                "business_name": "Atelier Couleurs",
                "business_email": "contact@atelier-couleurs.ch",
                "business_phone": "+41 22 555 11 22",
                "business_address": "Route de Carouge 18\n1227 Carouge GE",
                "default_locale": "fr",
                "default_currency": "CHF",
                "default_tax_rate": 0.077,
                "default_payment_terms": "Acompte de 40%, solde a la livraison",
                "default_validity_days": 21,
                "priced_items": [
                    _priced_item(
                        item_id="wall-prep",
                        name="Preparation des supports",
                        description="Protection, rebouchage leger et poncage avant mise en peinture",
                        unit_price_cents=8500,
                    ),
                    _priced_item(
                        item_id="interior-paint",
                        name="Peinture interieure mate",
                        description="Application de deux couches de peinture mate sur murs et plafonds",
                        pricing_mode="area_rectangle",
                        unit="m2",
                        unit_price_cents=1850,
                    ),
                    _priced_item(
                        item_id="premium-finish",
                        name="Finition haut de gamme",
                        description="Laque ou finition lessivable pour pieces de vie et boiseries",
                        pricing_mode="area_rectangle",
                        unit="m2",
                        unit_price_cents=2600,
                    ),
                ],
            },
        },
        {
            "username": "carpenter",
            "trade": "carpentry",
            "settings": {
                "business_name": "Bois & Mesure",
                "business_email": "contact@bois-mesure.ch",
                "business_phone": "+41 21 555 31 41",
                "business_address": "Chemin des Menuisiers 4\n1024 Ecublens VD",
                "default_locale": "fr",
                "default_currency": "CHF",
                "default_tax_rate": 0.077,
                "default_payment_terms": "50% a la commande, 50% a la pose",
                "default_validity_days": 30,
                "priced_items": [
                    _priced_item(
                        item_id="custom-shelf",
                        name="Etagere sur mesure",
                        description="Fabrication et pose d'une etagere sur mesure en melamine ou chene",
                        unit_price_cents=24000,
                    ),
                    _priced_item(
                        item_id="door-adjustment",
                        name="Ajustement de porte",
                        description="Rabotage, reprise de jeux et reglage de quincaillerie",
                        unit_price_cents=9500,
                    ),
                    _priced_item(
                        item_id="varnish",
                        name="Vernis de protection",
                        description="Application d'un vernis de protection sur meuble ou escalier",
                        pricing_mode="volume_direct",
                        unit="l",
                        unit_price_cents=3200,
                    ),
                ],
            },
        },
        {
            "username": "electrician",
            "trade": "electrical",
            "settings": {
                "business_name": "Courant Clair",
                "business_email": "contact@courant-clair.ch",
                "business_phone": "+41 32 555 41 51",
                "business_address": "Avenue de la Gare 27\n2000 Neuchatel",
                "default_locale": "fr",
                "default_currency": "CHF",
                "default_tax_rate": 0.077,
                "default_payment_terms": "Paiement a reception",
                "default_validity_days": 15,
                "priced_items": [
                    _priced_item(
                        item_id="outlet-install",
                        name="Pose de prise electrique",
                        description="Fourniture et pose d'une prise electrique standard ou renforcee",
                        unit_price_cents=14500,
                    ),
                    _priced_item(
                        item_id="panel-upgrade",
                        name="Mise a niveau du tableau",
                        description="Ajout de protections et remise au propre du tableau electrique",
                        unit_price_cents=42000,
                    ),
                    _priced_item(
                        item_id="cable-routing",
                        name="Passage de cables",
                        description="Passage de gaine et cable pour circuit eclairage ou prises",
                        unit_price_cents=1800,
                        unit="ml",
                    ),
                ],
            },
        },
    ]


def _priced_item(
    *,
    item_id: str,
    name: str,
    description: str,
    unit_price_cents: int,
    pricing_mode: str = "fixed",
    unit: str = "job",
    default_quantity: float = 1,
) -> dict[str, object]:
    return {
        "id": item_id,
        "name": name,
        "description": description,
        "pricing_mode": pricing_mode,
        "unit": unit,
        "unit_price_cents": unit_price_cents,
        "default_quantity": default_quantity,
        "is_active": True,
    }
