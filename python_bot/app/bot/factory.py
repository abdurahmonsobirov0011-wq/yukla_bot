import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import ErrorEvent

from app.bot.handlers import commands, media, admin
from app.bot.middlewares.db import DbSessionMiddleware
from app.bot.middlewares.rate_limit import InMemoryRateLimitMiddleware
from app.bot.middlewares.subscription import SubscriptionMiddleware
from app.bot.middlewares.user import UserMiddleware
from app.config import settings

logger = logging.getLogger("errors")


def create_bot() -> Bot:
    if not settings.bot_token:
        raise RuntimeError("BOT_TOKEN is required")
    return Bot(settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))


async def global_error_handler(event: ErrorEvent) -> bool:
    logger.exception("Unhandled aiogram update error", exc_info=event.exception)
    return True


def create_dispatcher() -> Dispatcher:
    dp = Dispatcher()
    dp.update.middleware(DbSessionMiddleware())
    dp.message.middleware(UserMiddleware())
    dp.message.middleware(SubscriptionMiddleware())
    dp.message.middleware(InMemoryRateLimitMiddleware())
    dp.errors.register(global_error_handler)
    dp.include_router(admin.router)
    dp.include_router(commands.router)
    dp.include_router(media.router)
    return dp
