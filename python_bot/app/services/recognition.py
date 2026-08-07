import hashlib
import hmac
import time
from pathlib import Path

import httpx

from app.config import settings
from app.services.schemas import SongMatch


class MusicRecognitionService:
    async def recognize(self, file_path: Path) -> SongMatch:
        if settings.audd_api_key:
            match = await self._audd(file_path)
            if match:
                return match
        if settings.acrcloud_host and settings.acrcloud_access_key and settings.acrcloud_access_secret:
            match = await self._acrcloud(file_path)
            if match:
                return match
        raise RuntimeError("Music was not recognized. Configure AUDD_API_KEY or ACRCloud credentials.")

    async def _audd(self, file_path: Path) -> SongMatch | None:
        async with httpx.AsyncClient(timeout=30) as client:
            with file_path.open("rb") as audio:
                res = await client.post(
                    "https://api.audd.io/",
                    data={"api_token": settings.audd_api_key, "return": "apple_music,spotify,lyrics"},
                    files={"file": (file_path.name, audio, "application/octet-stream")},
                )
        res.raise_for_status()
        result = res.json().get("result")
        if not result:
            return None
        spotify = result.get("spotify") or {}
        apple = result.get("apple_music") or {}
        lyrics = result.get("lyrics") or {}
        return SongMatch(
            title=result.get("title") or "",
            artist=result.get("artist") or "",
            album=result.get("album") or "",
            release_year=(result.get("release_date") or "")[:4],
            lyrics=lyrics.get("lyrics") or "",
            spotify_url=(spotify.get("external_urls") or {}).get("spotify", ""),
            apple_music_url=apple.get("url", ""),
            duration=result.get("duration"),
            cover_url=(apple.get("artwork") or {}).get("url"),
            confidence=0.98,
        )

    async def _acrcloud(self, file_path: Path) -> SongMatch | None:
        timestamp = str(int(time.time()))
        string_to_sign = "\n".join(["POST", "/v1/identify", settings.acrcloud_access_key, "audio", "1", timestamp])
        signature = base64_hmac(settings.acrcloud_access_secret, string_to_sign)
        data = {
            "access_key": settings.acrcloud_access_key,
            "sample_bytes": str(file_path.stat().st_size),
            "timestamp": timestamp,
            "signature": signature,
            "data_type": "audio",
            "signature_version": "1",
        }
        async with httpx.AsyncClient(timeout=30) as client:
            with file_path.open("rb") as audio:
                res = await client.post(
                    f"https://{settings.acrcloud_host}/v1/identify",
                    data=data,
                    files={"sample": (file_path.name, audio, "application/octet-stream")},
                )
        res.raise_for_status()
        music = (res.json().get("metadata") or {}).get("music") or []
        if not music:
            return None
        item = music[0]
        artists = ", ".join(a.get("name", "") for a in item.get("artists", []))
        return SongMatch(
            title=item.get("title", ""),
            artist=artists,
            album=(item.get("album") or {}).get("name", ""),
            release_year=(item.get("release_date") or "")[:4],
            duration=int(item.get("duration_ms", 0) / 1000) or None,
            confidence=float(item.get("score", 0)) / 100,
        )


def base64_hmac(secret: str, value: str) -> str:
    import base64

    digest = hmac.new(secret.encode(), value.encode(), hashlib.sha1).digest()
    return base64.b64encode(digest).decode()

