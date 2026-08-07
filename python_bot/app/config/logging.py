import logging
from logging.handlers import TimedRotatingFileHandler

from app.config import settings


def setup_logging() -> None:
    settings.ensure_dirs()
    fmt = "%(asctime)s %(levelname)s [%(name)s] %(message)s"
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(level=level, format=fmt)
    file_handler = TimedRotatingFileHandler(
        settings.log_dir / "bot.log",
        when="midnight",
        backupCount=30,
        encoding="utf-8",
    )
    file_handler.setFormatter(logging.Formatter(fmt))
    logging.getLogger().addHandler(file_handler)

    for name in ("errors", "downloads", "users", "owner"):
        handler = TimedRotatingFileHandler(
            settings.log_dir / f"{name}.log",
            when="midnight",
            backupCount=30,
            encoding="utf-8",
        )
        handler.setFormatter(logging.Formatter(fmt))
        logging.getLogger(name).addHandler(handler)
