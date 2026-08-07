import asyncio
import os
import sys
import logging
from aiohttp import web

# Add python_bot directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'python_bot')))

from app.config import settings
from app.config.logging import setup_logging
from app.db.session import create_schema
from app.bot.factory import create_bot, create_dispatcher

logger = logging.getLogger(__name__)

async def health_check_handler(request: web.Request) -> web.Response:
    return web.Response(text="Bot Running", status=200)

async def start_health_server(port: int) -> web.AppRunner:
    app = web.Application()
    app.router.add_get('/health', health_check_handler)
    app.router.add_get('/', health_check_handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, '0.0.0.0', port)
    await site.start()
    logger.info(f"🚀 Health check HTTP server running on port {port}")
    return runner

async def main() -> None:
    setup_logging()
    logger.info("Initializing database schema...")
    
    try:
        await create_schema()
        logger.info("✅ Database schema initialized successfully.")
    except Exception as exc:
        logger.warning(f"⚠️ Database schema initialization skipped or failed: {exc}")

    bot = create_bot()
    dp = create_dispatcher()

    port = int(os.environ.get("PORT", "8000"))
    runner = await start_health_server(port)

    webhook_host = os.environ.get("WEBHOOK_HOST") or os.environ.get("RAILWAY_STATIC_URL")
    
    if webhook_host:
        if not webhook_host.startswith("http"):
            webhook_host = f"https://{webhook_host}"
        webhook_url = f"{webhook_host}/webhook"
        logger.info(f"🔗 Setting Webhook mode to: {webhook_url}")
        await bot.set_webhook(url=webhook_url, drop_pending_updates=True)
    else:
        logger.info("🤖 Starting Polling mode...")
        await bot.delete_webhook(drop_pending_updates=True)
        await dp.start_polling(bot, allowed_updates=dp.resolve_used_update_types())

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except (KeyboardInterrupt, SystemExit):
        logger.info("Bot stopped cleanly.")
