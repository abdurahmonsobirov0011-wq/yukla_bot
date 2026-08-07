import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Download, MediaCache


def url_hash(url: str) -> str:
    return hashlib.sha256(url.encode("utf-8")).hexdigest()


class DownloadRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def log(self, download: Download) -> None:
        self.session.add(download)
        await self.session.commit()

    async def get_cache(self, url: str, quality: str, media_type: str) -> MediaCache | None:
        result = await self.session.execute(
            select(MediaCache).where(
                MediaCache.url_hash == url_hash(url),
                MediaCache.quality == quality,
                MediaCache.media_type == media_type,
            )
        )
        return result.scalar_one_or_none()

    async def set_cache(
        self,
        source_url: str,
        platform: str,
        media_type: str,
        quality: str,
        telegram_file_id: str,
        title: str = "",
        file_size: int = 0,
    ) -> None:
        result = await self.session.execute(
            select(MediaCache).where(
                MediaCache.url_hash == url_hash(source_url),
                MediaCache.quality == quality,
                MediaCache.media_type == media_type,
            )
        )
        cache = result.scalar_one_or_none()
        if cache is None:
            cache = MediaCache(
                source_url=source_url,
                url_hash=url_hash(source_url),
                platform=platform,
                media_type=media_type,
                quality=quality,
                telegram_file_id=telegram_file_id,
                title=title,
                file_size=file_size,
            )
            self.session.add(cache)
        else:
            cache.telegram_file_id = telegram_file_id
            cache.title = title
            cache.file_size = file_size
            cache.platform = platform
        await self.session.commit()
