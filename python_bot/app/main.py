import asyncio
import logging

from app.bot.factory import create_bot, create_dispatcher
from app.config.logging import setup_logging
from app.db.session import create_schema


async def main() -> None:
    setup_logging()
    await create_schema()
    bot = create_bot()
    dp = create_dispatcher()
    logging.info("Starting polling bot")
    await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())


if __name__ == "__main__":
    asyncio.run(main())

