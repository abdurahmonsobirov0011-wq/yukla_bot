from app.services.downloaders.ytdlp import YtDlpDownloader


def test_quality_selector() -> None:
    downloader = YtDlpDownloader()
    assert "height<=720" in downloader._video_selector("720")
    assert "height<=2160" in downloader._video_selector("4k")
    assert downloader._video_selector("best") == "bv*+ba/best"

