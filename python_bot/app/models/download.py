from sqlalchemy import BigInteger, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Download(TimestampMixin, Base):
    __tablename__ = "downloads"

    telegram_id: Mapped[int] = mapped_column(BigInteger, index=True)
    platform: Mapped[str] = mapped_column(String(64), index=True)
    source_url: Mapped[str] = mapped_column(Text)
    media_type: Mapped[str] = mapped_column(String(32), default="video")
    quality: Mapped[str] = mapped_column(String(32), default="best")
    file_size: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(32), default="success", index=True)
    error: Mapped[str] = mapped_column(Text, default="")
    processing_ms: Mapped[int] = mapped_column(Integer, default=0)


class MediaCache(TimestampMixin, Base):
    __tablename__ = "media_cache"
    __table_args__ = (UniqueConstraint("source_url", "quality", "media_type", name="uq_cache_item"),)

    source_url: Mapped[str] = mapped_column(Text)
    url_hash: Mapped[str] = mapped_column(String(96), index=True)
    platform: Mapped[str] = mapped_column(String(64), index=True)
    media_type: Mapped[str] = mapped_column(String(32), default="video")
    quality: Mapped[str] = mapped_column(String(32), default="best")
    telegram_file_id: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(String(512), default="")
    file_size: Mapped[int] = mapped_column(Integer, default=0)

