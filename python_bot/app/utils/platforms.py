import re
from enum import StrEnum


class Platform(StrEnum):
    INSTAGRAM = "instagram"
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    FACEBOOK = "facebook"
    PINTEREST = "pinterest"
    SNAPCHAT = "snapchat"
    TWITTER = "twitter"
    THREADS = "threads"
    REDDIT = "reddit"
    VIMEO = "vimeo"
    DAILYMOTION = "dailymotion"
    SOUNDCLOUD = "soundcloud"
    SPOTIFY = "spotify"
    LIKEE = "likee"
    BILIBILI = "bilibili"
    VK = "vk"
    TUMBLR = "tumblr"


PATTERNS: dict[Platform, re.Pattern[str]] = {
    Platform.INSTAGRAM: re.compile(r"instagram\.com/(p|reel|reels|stories|tv|s|[^/]+/?$)", re.I),
    Platform.YOUTUBE: re.compile(r"(youtube\.com/(watch|shorts|playlist|embed)|youtu\.be/)", re.I),
    Platform.TIKTOK: re.compile(r"(tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com)", re.I),
    Platform.FACEBOOK: re.compile(r"(facebook\.com|fb\.watch|fb\.com)", re.I),
    Platform.PINTEREST: re.compile(r"(pinterest\.|pin\.it)", re.I),
    Platform.SNAPCHAT: re.compile(r"(snapchat\.com|story\.snapchat\.com)", re.I),
    Platform.TWITTER: re.compile(r"(twitter\.com|x\.com)/", re.I),
    Platform.THREADS: re.compile(r"threads\.net/", re.I),
    Platform.REDDIT: re.compile(r"(reddit\.com|redd\.it)/", re.I),
    Platform.VIMEO: re.compile(r"vimeo\.com/", re.I),
    Platform.DAILYMOTION: re.compile(r"(dailymotion\.com|dai\.ly)/", re.I),
    Platform.SOUNDCLOUD: re.compile(r"soundcloud\.com/", re.I),
    Platform.SPOTIFY: re.compile(r"open\.spotify\.com/", re.I),
    Platform.LIKEE: re.compile(r"(likee\.video|likee\.com)/", re.I),
    Platform.BILIBILI: re.compile(r"bilibili\.com/", re.I),
    Platform.VK: re.compile(r"vk\.com/", re.I),
    Platform.TUMBLR: re.compile(r"tumblr\.com/", re.I),
}


URL_RE = re.compile(r"https?://[^\s<>()]+", re.I)


def extract_url(text: str) -> str | None:
    match = URL_RE.search(text or "")
    return match.group(0).rstrip(".,)") if match else None


def detect_platform(url: str) -> Platform | None:
    for platform, pattern in PATTERNS.items():
        if pattern.search(url):
            return platform
    return None

