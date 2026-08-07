from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    bot_token: str = Field(default="", alias="BOT_TOKEN")
    bot_username: str = Field(default="TezYuklaProBot", alias="BOT_USERNAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_base_url: str = Field(default="http://localhost:8080", alias="APP_BASE_URL")
    webhook_secret: str = Field(default="dev-secret", alias="WEBHOOK_SECRET")

    database_url: str = Field(default="sqlite+aiosqlite:///./cache/local.db", alias="DATABASE_URL")
    postgres_database_url: str = Field(default="", alias="POSTGRES_DATABASE_URL")
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")

    jwt_secret: str = Field(default="dev-secret-change-me-change-me-change-me", alias="JWT_SECRET")
    admin_password: str = Field(default="admin123456", alias="ADMIN_PASSWORD")
    admin_ids: list[int] = Field(default_factory=list, alias="ADMIN_IDS")
    forced_channels: list[str] = Field(default_factory=list, alias="FORCED_CHANNELS")

    download_dir: Path = Field(default=Path("./downloads"), alias="DOWNLOAD_DIR")
    cache_dir: Path = Field(default=Path("./cache"), alias="CACHE_DIR")
    log_dir: Path = Field(default=Path("./logs"), alias="LOG_DIR")
    max_upload_mb: int = Field(default=1900, alias="MAX_UPLOAD_MB")
    free_upload_mb: int = Field(default=50, alias="FREE_UPLOAD_MB")
    download_ttl_minutes: int = Field(default=30, alias="DOWNLOAD_TTL_MINUTES")

    ytdlp_path: str = Field(default="yt-dlp", alias="YTDLP_PATH")
    ffmpeg_path: str = Field(default="ffmpeg", alias="FFMPEG_PATH")
    ffprobe_path: str = Field(default="ffprobe", alias="FFPROBE_PATH")

    audd_api_key: str = Field(default="", alias="AUDD_API_KEY")
    acrcloud_host: str = Field(default="", alias="ACRCLOUD_HOST")
    acrcloud_access_key: str = Field(default="", alias="ACRCLOUD_ACCESS_KEY")
    acrcloud_access_secret: str = Field(default="", alias="ACRCLOUD_ACCESS_SECRET")
    spotify_client_id: str = Field(default="", alias="SPOTIFY_CLIENT_ID")
    spotify_client_secret: str = Field(default="", alias="SPOTIFY_CLIENT_SECRET")
    youtube_api_key: str = Field(default="", alias="YOUTUBE_API_KEY")
    apple_music_developer_token: str = Field(default="", alias="APPLE_MUSIC_DEVELOPER_TOKEN")

    click_service_id: str = Field(default="", alias="CLICK_SERVICE_ID")
    click_merchant_id: str = Field(default="", alias="CLICK_MERCHANT_ID")
    click_secret_key: str = Field(default="", alias="CLICK_SECRET_KEY")
    payme_merchant_id: str = Field(default="", alias="PAYME_MERCHANT_ID")
    payme_secret_key: str = Field(default="", alias="PAYME_SECRET_KEY")
    stripe_secret_key: str = Field(default="", alias="STRIPE_SECRET_KEY")

    @field_validator("admin_ids", "forced_channels", mode="before")
    @classmethod
    def split_csv(cls, value: str | list[str] | list[int]) -> list[str] | list[int]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    def ensure_dirs(self) -> None:
        for directory in (self.download_dir, self.cache_dir, self.log_dir):
            directory.mkdir(parents=True, exist_ok=True)

    @property
    def effective_database_url(self) -> str:
        if self.app_env == "production" and self.postgres_database_url:
            return self.postgres_database_url
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    cfg = Settings()
    cfg.ensure_dirs()
    return cfg


settings = get_settings()
