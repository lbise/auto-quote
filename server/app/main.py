from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.quotes import router as quotes_router
from app.api.routes.settings import router as settings_router
from app.api.routes.transcriptions import router as transcriptions_router
from app.core.auth import SESSION_COOKIE_NAME, verify_session_token
from app.core.config import ROOT_DIR, get_settings


settings = get_settings()
frontend_dist_dir = ROOT_DIR / "dist"

app = FastAPI(title=settings.app_name, debug=settings.debug)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(quotes_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(transcriptions_router, prefix="/api")


@app.middleware("http")
async def require_basic_auth(request: Request, call_next):
    if not settings.app_password:
        return await call_next(request)

    if request.method == "OPTIONS":
        return await call_next(request)

    if not request.url.path.startswith("/api"):
        return await call_next(request)

    if request.url.path == "/api/health" or request.url.path.startswith("/api/auth"):
        return await call_next(request)

    session_username = verify_session_token(request.cookies.get(SESSION_COOKIE_NAME))
    if session_username:
        return await call_next(request)

    return PlainTextResponse(
        "Authentication required",
        status_code=401,
        headers={"WWW-Authenticate": 'Basic realm="AutoQuote"'},
    )


if frontend_dist_dir.exists():
    assets_dir = frontend_dist_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str) -> FileResponse:
        requested_path = (frontend_dist_dir / full_path).resolve()

        if full_path and requested_path.is_file() and Path(requested_path).is_relative_to(frontend_dist_dir):
            return FileResponse(requested_path)

        return FileResponse(frontend_dist_dir / "index.html")
