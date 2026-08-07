import time
from collections.abc import Awaitable, Callable
from typing import Any

from aiogram import BaseMiddleware
from aiogram.types import Message, TelegramObject


class InMemoryRateLimitMiddleware(BaseMiddleware):
    def __init__(self, limit: int = 8, window: int = 60) -> None:
        self.limit = limit
        self.window = window
        self.hits: dict[int, list[float]] = {}

    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        user = data.get("event_from_user")
        message = event if isinstance(event, Message) else None
        if not user:
            return await handler(event, data)
        now = time.time()
        bucket = [t for t in self.hits.get(user.id, []) if now - t < self.window]
        if len(bucket) >= self.limit and message:
            return await message.answer("⏳ Juda ko‘p so‘rov. Birozdan keyin urinib ko‘ring.")
        bucket.append(now)
        self.hits[user.id] = bucket
        return await handler(event, data)

