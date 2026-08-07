import hashlib
import time
from dataclasses import dataclass

from app.services.schemas import RecognitionSummary


@dataclass(slots=True)
class CacheItem:
    value: RecognitionSummary
    expires_at: float


class CacheService:
    def __init__(self, ttl_seconds: int = 3600) -> None:
        self.ttl_seconds = ttl_seconds
        self._items: dict[str, CacheItem] = {}

    def make_key(self, telegram_file_unique_id: str, file_size: int | None = None) -> str:
        raw = f"{telegram_file_unique_id}:{file_size or 0}"
        return hashlib.sha256(raw.encode()).hexdigest()

    async def get(self, key: str) -> RecognitionSummary | None:
        item = self._items.get(key)
        if not item:
            return None
        if item.expires_at < time.time():
            self._items.pop(key, None)
            return None
        return item.value

    async def set(self, key: str, value: RecognitionSummary) -> None:
        self._items[key] = CacheItem(value=value, expires_at=time.time() + self.ttl_seconds)


recognition_cache = CacheService()

