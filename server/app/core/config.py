from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT_DIR / "data"


class Settings(BaseSettings):
    app_name: str = "AutoQuote API"
    app_env: str = "development"
    debug: bool = False
    database_url: str = Field(
        default=f"sqlite:///{(DATA_DIR / 'app.db').resolve()}",
        alias="DATABASE_URL",
    )
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    model_config = SettingsConfigDict(
        env_file=(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    return Settings()
