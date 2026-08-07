import json
import logging
import time
from pathlib import Path

from app.config import settings
from app.services.process import run_command
from app.services.schemas import DownloadedFile, MediaFormat, MediaInfo
from app.utils.platforms import detect_platform

logger = logging.getLogger(__name__)


VIDEO_HEIGHTS = {144, 240, 360, 480, 720, 1080, 1440, 2160}
AUDIO_BITRATES = {64, 128, 192, 256, 320}


class YtDlpDownloader:
    def __init__(self) -> None:
        self.binary = settings.ytdlp_path

    async def probe(self, url: str) -> MediaInfo:
        stdout, _ = await run_command(
            self.binary,
            "--dump-single-json",
            "--no-warnings",
            "--no-playlist",
            url,
            timeout=45,
        )
        data = json.loads(stdout)
        platform = detect_platform(url)
        formats: list[MediaFormat] = []
        for item in data.get("formats", []):
            fmt_id = str(item.get("format_id") or "")
            ext = str(item.get("ext") or "")
            height = item.get("height")
            abr = item.get("abr")
            label = f"{height}p" if height else (f"{int(abr)}kbps" if abr else fmt_id)
            if height in VIDEO_HEIGHTS or (abr and int(abr) in AUDIO_BITRATES):
                formats.append(
                    MediaFormat(
                        format_id=fmt_id,
                        label=label,
                        ext=ext,
                        height=height,
                        abr=int(abr) if abr else None,
                        filesize=item.get("filesize") or item.get("filesize_approx"),
                    )
                )
        return MediaInfo(
            source_url=url,
            platform=(platform.value if platform else data.get("extractor_key", "unknown").lower()),
            title=data.get("title") or "Media",
            duration=data.get("duration"),
            thumbnail=data.get("thumbnail"),
            uploader=data.get("uploader"),
            view_count=data.get("view_count"),
            formats=formats,
        )

    async def download(self, url: str, quality: str = "best", media_type: str = "video") -> DownloadedFile:
        platform = detect_platform(url)
        prefix = (platform.value if platform else "media")
        stamp = int(time.time() * 1000)
        out_template = str(settings.download_dir / f"{prefix}_{stamp}_%(id)s.%(ext)s")

        args = [self.binary, "--no-playlist", "--no-warnings", "--restrict-filenames", "-o", out_template]
        if media_type == "audio":
            bitrate = quality if quality in {"64", "128", "192", "256", "320"} else "192"
            args += [
                "-x",
                "--audio-format",
                "mp3",
                "--audio-quality",
                "0",
                "--postprocessor-args",
                f"ffmpeg:-b:a {bitrate}k",
            ]
        elif media_type == "image":
            args += ["--write-thumbnail", "--skip-download"]
        else:
            selector = self._video_selector(quality)
            args += ["-f", selector, "--merge-output-format", "mp4"]
        args.append(url)

        await run_command(*args, timeout=300)
        candidates = sorted(settings.download_dir.glob(f"{prefix}_{stamp}_*"), key=lambda p: p.stat().st_mtime)
        if not candidates:
            raise RuntimeError("Downloaded file was not created")
        path = candidates[-1]
        stat = path.stat()
        if stat.st_size > settings.max_upload_mb * 1024 * 1024:
            path.unlink(missing_ok=True)
            raise RuntimeError(f"File is larger than Telegram upload limit: {settings.max_upload_mb}MB")
        title = path.stem
        return DownloadedFile(
            path=path,
            file_name=path.name,
            file_size=stat.st_size,
            media_type=media_type,
            platform=prefix,
            title=title,
            source_url=url,
            quality=quality,
        )

    def _video_selector(self, quality: str) -> str:
        if quality in {"144", "240", "360", "480", "720", "1080", "1440", "2160", "4k"}:
            height = "2160" if quality == "4k" else quality
            return f"bv*[height<={height}]+ba/b[height<={height}]/best"
        return "bv*+ba/best"

