import base64
import hashlib
import hmac
import json
import time

from app.core.config import get_settings


SESSION_COOKIE_NAME = "autoquote_session"


def create_session_token(username: str) -> str:
    settings = get_settings()
    expires_at = int(time.time()) + settings.session_max_age_seconds
    payload = {"u": username, "e": expires_at}
    encoded_payload = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = _sign(encoded_payload)
    return f"{encoded_payload}.{signature}"


def verify_session_token(token: str | None) -> str | None:
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

    username = payload.get("u")
    expires_at = payload.get("e")
    settings = get_settings()

    if not isinstance(username, str) or not isinstance(expires_at, int):
        return None

    if expires_at < int(time.time()):
        return None

    if not hmac.compare_digest(username, settings.app_username):
        return None

    return username


def _sign(encoded_payload: str) -> str:
    settings = get_settings()
    secret = (settings.app_session_secret or settings.app_password or settings.app_name).encode("utf-8")
    return hmac.new(secret, encoded_payload.encode("utf-8"), hashlib.sha256).hexdigest()


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")


def _b64decode(value: str) -> str:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(f"{value}{padding}").decode("utf-8")
