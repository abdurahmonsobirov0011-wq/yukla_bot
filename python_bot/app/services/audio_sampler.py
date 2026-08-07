import logging
from pathlib import Path

from app.services.ffmpeg import FFmpegService
from app.services.schemas import AudioSample

logger = logging.getLogger(__name__)


class AudioSamplerService:
    def __init__(self, ffmpeg: FFmpegService | None = None) -> None:
        self.ffmpeg = ffmpeg or FFmpegService()

    async def create_samples(self, audio_path: Path, work_dir: Path) -> list[AudioSample]:
        duration = await self.ffmpeg.probe_duration(audio_path)
        if duration <= 0:
            raise RuntimeError("Audio duration could not be detected")

        windows = self._build_windows(duration)
        samples: list[AudioSample] = []
        for index, (label, start, clip_duration) in enumerate(windows, start=1):
            clip_path = work_dir / f"sample_{index:02d}_{int(start)}s.m4a"
            try:
                await self.ffmpeg.cut_audio_clip(audio_path, clip_path, start, clip_duration)
                samples.append(
                    AudioSample(
                        path=clip_path,
                        start_seconds=start,
                        duration_seconds=clip_duration,
                        label=label,
                    )
                )
            except Exception:
                logger.exception("Failed to create audio sample %s", label)
        if not samples:
            raise RuntimeError("No recognition samples could be created")
        return samples

    def _build_windows(self, duration: float) -> list[tuple[str, float, float]]:
        clip = 15.0 if duration >= 15 else max(duration, 5.0)
        starts = [
            ("0:20-0:35", 20.0),
            ("1:00-1:15", 60.0),
            ("2:00-2:15", 120.0),
            ("middle", max((duration / 2) - (clip / 2), 0.0)),
            ("near-end", max(duration - clip - 10.0, 0.0)),
        ]
        seen: set[int] = set()
        windows: list[tuple[str, float, float]] = []
        for label, start in starts:
            if start >= duration:
                continue
            start = max(min(start, max(duration - clip, 0.0)), 0.0)
            key = int(start)
            if key in seen:
                continue
            seen.add(key)
            windows.append((label, start, min(clip, duration - start)))
        if not windows:
            windows.append(("start", 0.0, min(clip, duration)))
        return windows

