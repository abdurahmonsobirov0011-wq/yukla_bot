from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, Header, HTTPException
from jose import jwt
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import async_session
from app.db.session import create_schema
from app.models import Download, ErrorLog, User

app = FastAPI(title="TezYukla Pro Admin API", version="1.0.0")


class LoginRequest(BaseModel):
    password: str


class BroadcastRequest(BaseModel):
    message: str


async def get_session() -> AsyncSession:
    async with async_session() as session:
        yield session


def require_admin(authorization: str = Header(default="")) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.removeprefix("Bearer ").strip()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Invalid token") from exc
    if not payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload


@app.on_event("startup")
async def startup() -> None:
    await create_schema()


@app.post("/auth/login")
async def login(data: LoginRequest) -> dict[str, str | int]:
    if data.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid password")
    token = jwt.encode(
        {"is_admin": True, "exp": datetime.utcnow() + timedelta(hours=24)},
        settings.jwt_secret,
        algorithm="HS256",
    )
    return {"token": token, "expires_in": 86400}


@app.get("/stats")
async def stats(_: dict = Depends(require_admin), session: AsyncSession = Depends(get_session)) -> dict:
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    users = await session.scalar(select(func.count()).select_from(User))
    active_today = await session.scalar(select(func.count()).select_from(User).where(User.last_active_at >= today))
    downloads = await session.scalar(select(func.count()).select_from(Download))
    errors = await session.scalar(select(func.count()).select_from(ErrorLog))
    failed = await session.scalar(select(func.count()).select_from(Download).where(Download.status == "failed"))
    banned = await session.scalar(select(func.count()).select_from(User).where(User.is_banned.is_(True)))
    return {
        "users": users or 0,
        "active_today": active_today or 0,
        "downloads": downloads or 0,
        "failed_downloads": failed or 0,
        "errors": errors or 0,
        "banned_users": banned or 0,
    }


@app.get("/users")
async def users(_: dict = Depends(require_admin), session: AsyncSession = Depends(get_session)) -> list[dict]:
    rows = (await session.execute(select(User).order_by(User.created_at.desc()).limit(100))).scalars()
    return [
        {
            "telegram_id": row.telegram_id,
            "username": row.username,
            "language": row.language,
            "premium": row.is_premium,
            "banned": row.is_banned,
            "downloads": row.download_count,
        }
        for row in rows
    ]


@app.post("/users/{telegram_id}/ban")
async def ban_user(
    telegram_id: int,
    reason: str = "Admin action",
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict[str, bool]:
    user = await session.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = True
    user.ban_reason = reason
    await session.commit()
    return {"banned": True}


@app.post("/users/{telegram_id}/unban")
async def unban_user(
    telegram_id: int,
    _: dict = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict[str, bool]:
    user = await session.scalar(select(User).where(User.telegram_id == telegram_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_banned = False
    user.ban_reason = ""
    await session.commit()
    return {"banned": False}

