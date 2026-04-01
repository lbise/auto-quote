from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.db import get_db
from app.models.user import User
from app.schemas.settings import SettingsRead, SettingsUpdate
from app.services.settings_service import get_or_create_settings, update_settings


router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("", response_model=SettingsRead)
def read_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> SettingsRead:
    settings = get_or_create_settings(db, current_user.id)
    return SettingsRead.model_validate(settings)


@router.patch("", response_model=SettingsRead)
def patch_settings(
    payload: SettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SettingsRead:
    settings = update_settings(db, current_user.id, payload)
    return SettingsRead.model_validate(settings)
