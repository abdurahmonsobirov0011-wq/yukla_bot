from sqlalchemy import BigInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class AdminAction(TimestampMixin, Base):
    __tablename__ = "admin_actions"
    admin_telegram_id: Mapped[int] = mapped_column(BigInteger, index=True)
    action: Mapped[str] = mapped_column(String(128), index=True)
    target: Mapped[str] = mapped_column(String(256), default="")
    payload: Mapped[str] = mapped_column(Text, default="")


class ErrorLog(TimestampMixin, Base):
    __tablename__ = "error_logs"
    source: Mapped[str] = mapped_column(String(128), index=True)
    message: Mapped[str] = mapped_column(Text)
    traceback: Mapped[str] = mapped_column(Text, default="")

