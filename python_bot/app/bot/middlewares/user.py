from collections.abc import Awaitable, Callable
import logging
from typing import Any

from aiogram import BaseMiddleware
from aiogram.types import Message, TelegramObject
from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.users import UserRepository

user_logger = logging.getLogger("users")


class UserMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        message = event if isinstance(event, Message) else None
        from_user = data.get("event_from_user")
        session: AsyncSession | None = data.get("session")
        if from_user and session:
            user = await UserRepository(session).get_or_create(
                telegram_id=from_user.id,
                username=from_user.username or "",
                first_name=from_user.first_name or "",
                last_name=from_user.last_name or "",
                language=from_user.language_code or "uz",
            )
            data["db_user"] = user
            user_logger.info("User activity telegram_id=%s username=%s", from_user.id, from_user.username or "")
            if user.is_banned and message:
                return await message.answer("⛔ Hisobingiz bloklangan.")
        return await handler(event, data)
