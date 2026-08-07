from collections.abc import Awaitable, Callable
from typing import Any

from aiogram import BaseMiddleware, Bot
from aiogram.types import Message, TelegramObject

from app.bot.keyboards.inline import subscription_menu
from app.config import settings


class SubscriptionMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        if not settings.forced_channels:
            return await handler(event, data)
        message = event if isinstance(event, Message) else None
        user = data.get("event_from_user")
        bot: Bot = data["bot"]
        if not message or not user or message.text in {"/start", "/help", "/yordam"}:
            return await handler(event, data)
        for channel in settings.forced_channels:
            try:
                member = await bot.get_chat_member(channel, user.id)
                if member.status in {"left", "kicked"}:
                    raise RuntimeError("not subscribed")
            except Exception:
                return await message.answer(
                    "🔒 Botdan foydalanish uchun kanallarga obuna bo‘ling.",
                    reply_markup=subscription_menu(settings.forced_channels),
                )
        return await handler(event, data)

