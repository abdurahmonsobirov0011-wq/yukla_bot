import base64
import logging

import httpx

from app.config import settings
from app.services.downloaders.ytdlp import YtDlpDownloader
from app.services.schemas import MediaInfo, SongMatch

logger = logging.getLogger(__name__)


class SearchService:
    def __init__(self, downloader: YtDlpDownloader | None = None) -> None:
        self.downloader = downloader or YtDlpDownloader()

    async def youtube(self, query: str) -> MediaInfo:
        return await self.downloader.probe(f"ytsearch1:{query}")

    async def song(self, query: str) -> SongMatch:
        spotify = await self.spotify_search(query)
        if spotify:
            return spotify
        media = await self.youtube(f"{query} audio")
        return SongMatch(
            title=media.title,
            artist=media.uploader or "",
            youtube_url=media.source_url,
            duration=media.duration,
            cover_url=media.thumbnail,
            confidence=0.75,
        )

    async def spotify_search(self, query: str) -> SongMatch | None:
        if not settings.spotify_client_id or not settings.spotify_client_secret:
            return None
        auth = base64.b64encode(
            f"{settings.spotify_client_id}:{settings.spotify_client_secret}".encode()
        ).decode()
        async with httpx.AsyncClient(timeout=15) as client:
            token_res = await client.post(
                "https://accounts.spotify.com/api/token",
                headers={"Authorization": f"Basic {auth}"},
                data={"grant_type": "client_credentials"},
            )
            token_res.raise_for_status()
            token = token_res.json()["access_token"]
            res = await client.get(
                "https://api.spotify.com/v1/search",
                headers={"Authorization": f"Bearer {token}"},
                params={"q": query, "type": "track", "limit": 1},
            )
            res.raise_for_status()
        items = res.json().get("tracks", {}).get("items", [])
        if not items:
            return None
        item = items[0]
        artists = ", ".join(a["name"] for a in item.get("artists", []))
        images = item.get("album", {}).get("images", [])
        return SongMatch(
            title=item.get("name", ""),
            artist=artists,
            album=item.get("album", {}).get("name", ""),
            release_year=(item.get("album", {}).get("release_date", "") or "")[:4],
            spotify_url=item.get("external_urls", {}).get("spotify", ""),
            duration=int(item.get("duration_ms", 0) / 1000) or None,
            cover_url=images[0]["url"] if images else None,
            confidence=0.95,
        )

