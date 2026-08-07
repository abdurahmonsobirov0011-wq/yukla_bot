import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import TypeVar

logger = logging.getLogger(__name__)
T = TypeVar("T")


class RetryService:
    async def run(
        self,
        operation: Callable[[], Awaitable[T]],
        attempts: int = 2,
        delay_seconds: float = 1.0,
    ) -> T:
        last_error: Exception | None = None
        for attempt in range(1, attempts + 1):
            try:
                return await operation()
            except Exception as exc:
                last_error = exc
                logger.warning("Retryable operation failed attempt %s/%s: %s", attempt, attempts, exc)
                if attempt < attempts:
                    await asyncio.sleep(delay_seconds * attempt)
        assert last_error is not None
        raise last_error

