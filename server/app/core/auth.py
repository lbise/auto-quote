import base64
import hashlib
import hmac
import json
import time

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.db import get_db
from app.models.user import User


SESSION_COOKIE_NAME = "autoquote_session"


def create_session_token(user_id: int) -> str:
    settings = get_settings()
    expires_at = int(time.time()) + settings.session_max_age_seconds
    payload = {"u": user_id, "e": expires_at}
    encoded_payload = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _sign(encoded_payload)
    return f"{encoded_payload}.{signature}"


def verify_session_token(token: str | None) -> int | None:
    if not token:
        return None

    try:
        encoded_payload, signature = token.split(".", 1)
    except ValueError:
        return None

    if not hmac.compare_digest(signature, _sign(encoded_payload)):
        return None

    try:
        payload = json.loads(_b64decode(encoded_payload))
    except (json.JSONDecodeError, ValueError):
        return None

    user_id = payload.get("u")
    expires_at = payload.get("e")

    if not isinstance(user_id, int) or not isinstance(expires_at, int):
        return None

    if expires_at < int(time.time()):
        return None

    return user_id


def get_session_user(db: Session, token: str | None) -> User | None:
    user_id = verify_session_token(token)
    if user_id is None:
        return None

    user = db.get(User, user_id)
    if user is None or not user.is_active:
        return None

    return user


def get_current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    user = get_session_user(db, session_token)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    return user


def _sign(encoded_payload: str) -> str:
    settings = get_settings()
    secret = (settings.app_session_secret or settings.demo_password or settings.app_password or settings.app_name).encode(
        "utf-8"
    )
    return hmac.new(secret, encoded_payload.encode("utf-8"), hashlib.sha256).hexdigest()


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64decode(value: str) -> str:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}").decode("utf-8")
