import logging
from pathlib import Path

from app.services.ffmpeg import FFmpegService

logger = logging.getLogger(__name__)


class AudioExtractorService:
    def __init__(self, ffmpeg: FFmpegService | None = None) -> None:
        self.ffmpeg = ffmpeg or FFmpegService()

    async def extract_normalized_audio(self, input_path: Path, work_dir: Path) -> Path:
        input_size_mb = input_path.stat().st_size / (1024 * 1024)
        bitrate = "48k" if input_size_mb > 500 else "64k"
        output_path = work_dir / f"{input_path.stem}_normalized.m4a"
        logger.info("Normalizing audio. input_size_mb=%.2f bitrate=%s", input_size_mb, bitrate)
        return await self.ffmpeg.extract_audio(input_path, output_path, bitrate=bitrate)

