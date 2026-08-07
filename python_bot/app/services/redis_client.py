import asyncio
import logging

import redis.asyncio as redis

from app.config import settings

logger = logging.getLogger(__name__)

redis_client: redis.Redis | None = None


async def connect_redis_with_retry(attempts: int = 8, delay_seconds: float = 2.0) -> redis.Redis | None:
    global redis_client
    if not settings.redis_url:
        logger.info("REDIS_URL is empty; Redis-backed features are disabled")
        return None

    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            client = redis.from_url(settings.redis_url, encoding="utf-8", decode_responses=True)
            await client.ping()
            redis_client = client
            logger.info("Redis connection is ready")
            return client
        except Exception as exc:
            last_error = exc
            logger.warning("Redis startup attempt %s/%s failed: %s", attempt, attempts, exc)
            await asyncio.sleep(delay_seconds)

    logger.error("Redis is unavailable after %s attempts: %s", attempts, last_error)
    return None


async def close_redis() -> None:
    global redis_client
    if redis_client is not None:
        await redis_client.aclose()
        redis_client = None
