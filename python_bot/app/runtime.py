import asyncio
import logging
import os
import signal
from contextlib import suppress

from aiohttp import web
from aiogram.types import Update

from app.bot.factory import create_bot, create_dispatcher
from app.config import settings
from app.config.logging import setup_logging
from app.db.session import close_database, create_schema_with_retry
from app.services.redis_client import close_redis, connect_redis_with_retry

logger = logging.getLogger(__name__)


async def health_check_handler(request: web.Request) -> web.Response:
    return web.Response(text="Bot Running", status=200)


async def create_web_app(bot, dispatcher) -> web.Application:
    app = web.Application()

    async def webhook_handler(request: web.Request) -> web.Response:
        if settings.webhook_secret:
            token = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
            if token != settings.webhook_secret:
                return web.Response(status=403, text="Forbidden")
        try:
            update = Update.model_validate(await request.json(), context={"bot": bot})
            await dispatcher.feed_update(bot, update)
        except Exception:
            logging.getLogger("errors").exception("Webhook update failed")
        return web.Response(text="OK", status=200)

    app.router.add_get("/health", health_check_handler)
    app.router.add_get("/", health_check_handler)
    app.router.add_post("/webhook", webhook_handler)
    return app


async def start_http_server(bot, dispatcher) -> web.AppRunner:
    app = await create_web_app(bot, dispatcher)
    runner = web.AppRunner(app, access_log=logging.getLogger("aiohttp.access"))
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", settings.port)
    await site.start()
    logger.info("HTTP server running on port %s", settings.port)
    return runner


def public_url() -> str:
    for key in ("WEBHOOK_HOST", "RAILWAY_PUBLIC_DOMAIN", "RAILWAY_STATIC_URL"):
        value = os.environ.get(key, "").strip()
        if value:
            if not value.startswith(("http://", "https://")):
                value = f"https://{value}"
            return value.rstrip("/")
    return settings.public_base_url


async def main() -> None:
    setup_logging()
    logger.info("Starting TezYukla bot")

    await create_schema_with_retry()
    await connect_redis_with_retry()

    bot = create_bot()
    dispatcher = create_dispatcher()
    runner = await start_http_server(bot, dispatcher)
    stop_event = asyncio.Event()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        with suppress(NotImplementedError):
            loop.add_signal_handler(sig, stop_event.set)

    polling_task: asyncio.Task | None = None
    try:
        url = public_url()
        if url:
            webhook_url = f"{url}/webhook"
            logger.info("Starting webhook mode: %s", webhook_url)
            await bot.set_webhook(
                url=webhook_url,
                drop_pending_updates=True,
                secret_token=settings.webhook_secret or None,
            )
            await stop_event.wait()
        else:
            logger.info("Starting long polling mode")
            await bot.delete_webhook(drop_pending_updates=True)
            polling_task = asyncio.create_task(
                dispatcher.start_polling(bot, allowed_updates=dispatcher.resolve_used_update_types())
            )
            await stop_event.wait()
    except Exception:
        logging.getLogger("errors").exception("Fatal runtime error")
        raise
    finally:
        logger.info("Shutting down")
        if polling_task:
            polling_task.cancel()
            with suppress(asyncio.CancelledError):
                await polling_task
        with suppress(Exception):
            await bot.delete_webhook(drop_pending_updates=False)
        await bot.session.close()
        await runner.cleanup()
        await close_redis()
        await close_database()
