from app.utils.platforms import Platform, detect_platform, extract_url


def test_extract_url() -> None:
    assert extract_url("salom https://youtu.be/abc.") == "https://youtu.be/abc"


def test_detect_major_platforms() -> None:
    assert detect_platform("https://www.instagram.com/reel/abc/") == Platform.INSTAGRAM
    assert detect_platform("https://youtube.com/shorts/abc") == Platform.YOUTUBE
    assert detect_platform("https://x.com/user/status/1") == Platform.TWITTER
    assert detect_platform("https://www.reddit.com/r/test/comments/1/post/") == Platform.REDDIT

