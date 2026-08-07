from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from app.bot.handlers import commands, media, admin
from app.bot.middlewares.db import DbSessionMiddleware
from app.bot.middlewares.rate_limit import InMemoryRateLimitMiddleware
from app.bot.middlewares.subscription import SubscriptionMiddleware
from app.bot.middlewares.user import UserMiddleware
from app.config import settings


def create_bot() -> Bot:
    return Bot(settings.bot_token, default=DefaultBotProperties(parse_mode=ParseMode.HTML))


def create_dispatcher() -> Dispatcher:
    dp = Dispatcher()
    dp.update.middleware(DbSessionMiddleware())
    dp.message.middleware(UserMiddleware())
    dp.message.middleware(SubscriptionMiddleware())
    dp.message.middleware(InMemoryRateLimitMiddleware())
    dp.include_router(admin.router)
    dp.include_router(commands.router)
    dp.include_router(media.router)
    return dp
