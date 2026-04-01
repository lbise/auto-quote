from sqlalchemy import select
from sqlalchemy.orm import Session

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status

from app.core.auth import SESSION_COOKIE_NAME, create_session_token, get_session_user
from app.core.config import get_settings
from app.core.db import get_db
from app.core.passwords import verify_password
from app.models.user import User
from app.schemas.auth import AuthLoginRequest, AuthSessionResponse
from app.services.bootstrap_service import ensure_demo_users


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/session", response_model=AuthSessionResponse)
def read_session(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    user = get_session_user(db, session_token)
    return _build_session_response(user)


@router.post("/login", response_model=AuthSessionResponse)
def login(payload: AuthLoginRequest, response: Response, db: Session = Depends(get_db)) -> AuthSessionResponse:
    settings = get_settings()
    ensure_demo_users(db)
    normalized_username = payload.username.strip().lower()
    user = db.scalar(select(User).where(User.username == normalized_username))

    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=create_session_token(user.id),
        httponly=True,
        samesite="lax",
        secure=settings.app_env != "development",
        max_age=settings.session_max_age_seconds,
        path="/",
    )
    return _build_session_response(user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout() -> Response:
    settings = get_settings()
    response = Response(status_code=status.HTTP_204_NO_CONTENT)
    response.delete_cookie(
        key=SESSION_COOKIE_NAME,
        httponly=True,
        samesite="lax",
        secure=settings.app_env != "development",
        path="/",
    )
    return response


def _build_session_response(user: User | None) -> AuthSessionResponse:
    if user is None:
        return AuthSessionResponse(authenticated=False)

    return AuthSessionResponse(
        authenticated=True,
        user_id=user.id,
        username=user.username,
        trade=user.trade,
    )
