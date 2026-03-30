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
    app_username: str = Field(default="owner", alias="APP_USERNAME")
    app_password: str | None = Field(default=None, alias="APP_PASSWORD")
    database_url: str = Field(
        default=f"sqlite:///{(DATA_DIR / 'app.db').resolve()}",
        alias="DATABASE_URL",
    )
    allowed_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])
    llm_mode: str = Field(default="openai", alias="LLM_MODE")
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gemini-2.5-flash", alias="OPENAI_MODEL")
    openai_base_url: str | None = Field(
        default="https://generativelanguage.googleapis.com/v1beta/openai",
        alias="OPENAI_BASE_URL",
    )
    llm_timeout_seconds: float = Field(default=30, alias="LLM_TIMEOUT_SECONDS")

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
