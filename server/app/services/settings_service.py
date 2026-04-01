from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.settings import AppSettings
from app.schemas.settings import SettingsUpdate


def get_or_create_settings(db: Session, user_id: int) -> AppSettings:
    settings = db.scalar(select(AppSettings).where(AppSettings.user_id == user_id))
    if settings is None:
        settings = AppSettings(user_id=user_id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


def update_settings(db: Session, user_id: int, payload: SettingsUpdate) -> AppSettings:
    settings = get_or_create_settings(db, user_id)
    updates = payload.model_dump(exclude_unset=True)

    for field, value in updates.items():
        if field == "default_locale" and isinstance(value, str):
            value = value.lower()
        setattr(settings, field, value)

    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings
