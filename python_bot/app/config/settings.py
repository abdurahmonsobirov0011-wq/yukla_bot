from functools import lru_cache
import os
from pathlib import Path
import tempfile

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    bot_token: str = Field(default="", alias="BOT_TOKEN")
    bot_username: str = Field(default="TezYuklaProBot", alias="BOT_USERNAME")
    owner_id: int = Field(default=0, alias="OWNER_ID")
    app_env: str = Field(default="development", alias="APP_ENV")
    app_base_url: str = Field(default="http://localhost:8080", alias="APP_BASE_URL")
    webhook_host: str = Field(default="", alias="WEBHOOK_HOST")
    webhook_secret: str = Field(default="", alias="WEBHOOK_SECRET")
    port: int = Field(default=8000, alias="PORT")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")

    database_url: str = Field(default="sqlite+aiosqlite:////tmp/tezyukla-cache/local.db", alias="DATABASE_URL")
    postgres_database_url: str = Field(default="", alias="POSTGRES_DATABASE_URL")
    redis_url: str = Field(default="", alias="REDIS_URL")

    jwt_secret: str = Field(default="", alias="JWT_SECRET")
    admin_password: str = Field(default="", alias="ADMIN_PASSWORD")
    admin_ids_raw: str = Field(default="", alias="ADMIN_IDS")
    forced_channels_raw: str = Field(default="", alias="FORCED_CHANNELS")

    download_dir: Path = Field(default=Path("/tmp/tezyukla-downloads"), alias="DOWNLOAD_DIR")
    cache_dir: Path = Field(default=Path("/tmp/tezyukla-cache"), alias="CACHE_DIR")
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

    def ensure_dirs(self) -> None:
        for directory in (self.download_dir, self.cache_dir, self.log_dir):
            if os.name == "nt" and directory.is_absolute() and len(directory.parts) > 1 and directory.parts[1] == "tmp":
                directory = Path(tempfile.gettempdir(), *directory.parts[2:])
            try:
                directory.mkdir(parents=True, exist_ok=True)
            except PermissionError:
                if os.name != "nt":
                    raise
                fallback = Path(tempfile.gettempdir(), directory.name)
                fallback.mkdir(parents=True, exist_ok=True)

    @property
    def effective_database_url(self) -> str:
        url = self.postgres_database_url or self.database_url
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and "+asyncpg" not in url:
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    @property
    def effective_admin_ids(self) -> list[int]:
        ids: list[int] = []
        for item in self.admin_ids_raw.split(","):
            item = item.strip()
            if item:
                ids.append(int(item))
        ids = list(dict.fromkeys(ids))
        if self.owner_id and self.owner_id not in ids:
            ids.append(self.owner_id)
        return ids

    @property
    def forced_channels(self) -> list[str]:
        return [item.strip() for item in self.forced_channels_raw.split(",") if item.strip()]

    @property
    def public_base_url(self) -> str:
        host = self.webhook_host or self.app_base_url
        if not host:
            return ""
        if not host.startswith(("http://", "https://")):
            host = f"https://{host}"
        return host.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    cfg = Settings()
    cfg.ensure_dirs()
    return cfg


settings = get_settings()
