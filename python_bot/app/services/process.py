import asyncio
import logging

logger = logging.getLogger(__name__)


async def run_command(*args: str, timeout: int = 120) -> tuple[str, str]:
    logger.info("Running command: %s", " ".join(args[:2]))
    process = await asyncio.create_subprocess_exec(
        *args,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=timeout)
    except TimeoutError:
        process.kill()
        await process.wait()
        raise RuntimeError(f"Command timed out after {timeout}s")
    out = stdout.decode("utf-8", errors="replace")
    err = stderr.decode("utf-8", errors="replace")
    if process.returncode:
        raise RuntimeError(err.strip() or out.strip() or f"Command failed: {process.returncode}")
    return out, err

