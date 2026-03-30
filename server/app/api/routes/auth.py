import secrets

from fastapi import APIRouter, Cookie, HTTPException, Response, status

from app.core.auth import SESSION_COOKIE_NAME, create_session_token, verify_session_token
from app.core.config import get_settings
from app.schemas.auth import AuthLoginRequest, AuthSessionResponse


router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/session", response_model=AuthSessionResponse)
def read_session(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
) -> AuthSessionResponse:
    username = verify_session_token(session_token)
    return AuthSessionResponse(authenticated=username is not None, username=username)


@router.post("/login", response_model=AuthSessionResponse)
def login(payload: AuthLoginRequest, response: Response) -> AuthSessionResponse:
    settings = get_settings()

    if not settings.app_password:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="App login is not configured. Set APP_PASSWORD to enable demo sign-in.",
        )

    if not secrets.compare_digest(payload.username, settings.app_username) or not secrets.compare_digest(
        payload.password, settings.app_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password.",
        )

    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=create_session_token(settings.app_username),
        httponly=True,
        samesite="lax",
        secure=settings.app_env != "development",
        max_age=settings.session_max_age_seconds,
        path="/",
    )
    return AuthSessionResponse(authenticated=True, username=settings.app_username)


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
