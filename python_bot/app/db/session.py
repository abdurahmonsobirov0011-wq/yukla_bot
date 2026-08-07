import asyncio
import logging

from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.config import settings

logger = logging.getLogger(__name__)

engine = create_async_engine(
    settings.effective_database_url,
    pool_pre_ping=True,
    pool_recycle=1800,
)
async_session = async_sessionmaker(engine, expire_on_commit=False)


async def create_schema() -> None:
    from app.db.base import Base
    from app import models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def create_schema_with_retry(attempts: int = 8, delay_seconds: float = 2.0) -> None:
    last_error: Exception | None = None
    for attempt in range(1, attempts + 1):
        try:
            await create_schema()
            logger.info("Database schema is ready")
            return
        except Exception as exc:
            last_error = exc
            logger.warning("Database startup attempt %s/%s failed: %s", attempt, attempts, exc)
            await asyncio.sleep(delay_seconds)
    raise RuntimeError(f"Database is unavailable after {attempts} attempts: {last_error}")


async def close_database() -> None:
    await engine.dispose()
