from dataclasses import dataclass, field
from pathlib import Path


@dataclass(slots=True)
class MediaFormat:
    format_id: str
    label: str
    ext: str
    height: int | None = None
    abr: int | None = None
    filesize: int | None = None


@dataclass(slots=True)
class MediaInfo:
    source_url: str
    platform: str
    title: str
    duration: int | None
    thumbnail: str | None
    uploader: str | None
    view_count: int | None
    formats: list[MediaFormat] = field(default_factory=list)


@dataclass(slots=True)
class DownloadedFile:
    path: Path
    file_name: str
    file_size: int
    media_type: str
    platform: str
    title: str
    source_url: str
    quality: str


@dataclass(slots=True)
class SongMatch:
    title: str
    artist: str
    album: str = ""
    release_year: str = ""
    genre: str = ""
    lyrics: str = ""
    spotify_url: str = ""
    apple_music_url: str = ""
    youtube_url: str = ""
    duration: int | None = None
    cover_url: str | None = None
    confidence: float = 0.0
    timestamp_seconds: float | None = None
    source_clip: Path | None = None


@dataclass(slots=True)
class AudioSample:
    path: Path
    start_seconds: float
    duration_seconds: float
    label: str


@dataclass(slots=True)
class RecognitionSummary:
    best_match: SongMatch | None
    matches: list[SongMatch]
    attempted_samples: int
