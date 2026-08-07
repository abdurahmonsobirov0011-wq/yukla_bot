import json
import logging
from pathlib import Path

from app.config import settings
from app.services.process import run_command

logger = logging.getLogger(__name__)


class FFmpegService:
    async def probe_duration(self, file_path: Path) -> float:
        stdout, _ = await run_command(
            settings.ffprobe_path,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(file_path),
            timeout=30,
        )
        data = json.loads(stdout)
        return max(float(data.get("format", {}).get("duration") or 0), 0.0)

    async def extract_audio(
        self,
        input_path: Path,
        output_path: Path,
        bitrate: str = "64k",
    ) -> Path:
        logger.info("Extracting normalized audio from %s to %s", input_path, output_path)
        await run_command(
            settings.ffmpeg_path,
            "-hide_banner",
            "-nostdin",
            "-y",
            "-i",
            str(input_path),
            "-vn",
            "-map",
            "0:a:0",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "aac",
            "-b:a",
            bitrate,
            "-movflags",
            "+faststart",
            str(output_path),
            timeout=300,
        )
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise RuntimeError("Audio extraction produced an empty file")
        return output_path

    async def cut_audio_clip(
        self,
        input_path: Path,
        output_path: Path,
        start_seconds: float,
        duration_seconds: float,
        bitrate: str = "64k",
    ) -> Path:
        logger.info("Creating audio sample %.2fs + %.2fs: %s", start_seconds, duration_seconds, output_path)
        await run_command(
            settings.ffmpeg_path,
            "-hide_banner",
            "-nostdin",
            "-y",
            "-ss",
            f"{start_seconds:.3f}",
            "-t",
            f"{duration_seconds:.3f}",
            "-i",
            str(input_path),
            "-vn",
            "-ac",
            "1",
            "-ar",
            "16000",
            "-c:a",
            "aac",
            "-b:a",
            bitrate,
            str(output_path),
            timeout=90,
        )
        if not output_path.exists() or output_path.stat().st_size == 0:
            raise RuntimeError(f"Audio sample was not created: {output_path.name}")
        return output_path

