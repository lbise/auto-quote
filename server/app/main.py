from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.quotes import router as quotes_router
from app.api.routes.settings import router as settings_router
from app.api.routes.transcriptions import router as transcriptions_router
from app.core.config import ROOT_DIR, get_settings
from app.core.db import SessionLocal
from app.services.bootstrap_service import ensure_demo_users


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


@app.on_event("startup")
def bootstrap_demo_data() -> None:
    with SessionLocal() as db:
        ensure_demo_users(db)


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
