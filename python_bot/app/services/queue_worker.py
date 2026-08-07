import asyncio
from collections.abc import Awaitable, Callable
from typing import TypeVar

T = TypeVar("T")


class QueueWorker:
    def __init__(self, concurrency: int = 2) -> None:
        self._semaphore = asyncio.Semaphore(concurrency)

    async def run(self, task: Callable[[], Awaitable[T]]) -> T:
        async with self._semaphore:
            return await task()


recognition_queue = QueueWorker(concurrency=2)

