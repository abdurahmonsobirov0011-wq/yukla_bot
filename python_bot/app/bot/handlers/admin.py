import logging
import time
from aiogram import Router, Bot, F
from aiogram.filters import Command
from aiogram.types import Message
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.config import settings
from app.models import User, Download
from app.repositories.users import UserRepository

logger = logging.getLogger(__name__)
router = Router(name="admin_commands")

# In-memory stores for channel forcejoin and settings when DB/Redis is optional
FORCED_CHANNELS: set[str] = set(settings.forced_channels)
FORCE_JOIN_ACTIVE: bool = True
MAINTENANCE_MODE: bool = False


def is_owner(user_id: int) -> bool:
    return user_id in settings.effective_admin_ids


@router.message(Command("admin"))
async def admin_menu(message: Message) -> None:
    if not is_owner(message.from_user.id):
        return await message.answer("❌ You are not authorized.")
    
    await message.answer(
        "👑 <b>Admin Controls (aiogram 3.x)</b>\n\n"
        "<b>Commands:</b>\n"
        "/broadcast - Tarqatish\n"
        "/channel - Majburiy kanallarni boshqarish (/channel add @ch, /channel remove @ch, /channel list)\n"
        "/forcejoin - Majburiy obunani yoqish/o'chirish (/forcejoin on / off)\n"
        "/stats - Tizim statistikasi\n"
        "/users - Foydalanuvchilar\n"
        "/ban [user_id] - Bloklash\n"
        "/unban [user_id] - Blokdan chiqarish\n"
        "/maintenance [on/off] - Texnik rejim"
    )


@router.message(Command("broadcast"))
async def broadcast_cmd(message: Message) -> None:
    if not is_owner(message.from_user.id):
        return await message.answer("❌ You are not authorized.")
    
    await message.answer("📢 Tarqatmoqchi bo'lgan xabaringizni yuboring (reply yoki matn formatida):")


@router.message(Command("channel"))
async def channel_cmd(message: Message) -> None:
    if not is_owner(message.from_user.id):
        return await message.answer("❌ You are not authorized.")
    
    args = message.text.split()[1:] if message.text else []
    if not args:
        return await message.answer("Format: /channel add @ch | /channel remove @ch | /channel list")
    
    action = args[0].lower()
    if action == "add" and len(args) > 1:
        ch = args[1]
        FORCED_CHANNELS.add(ch)
        await message.answer(f"✅ Kanal qo'shildi: {ch}")
    elif action == "remove" and len(args) > 1:
        ch = args[1]
        FORCED_CHANNELS.discard(ch)
        await message.answer(f"✅ Kanal o'chirildi: {ch}")
    elif action == "list":
        if not FORCED_CHANNELS:
            await message.answer("📋 Majburiy kanallar yo'q.")
        else:
            ch_list = "\n".join([f"• {c}" for c in FORCED_CHANNELS])
            await message.answer(f"📋 Majburiy kanallar:\n{ch_list}")
    else:
        await message.answer("Format: /channel [add|remove|list] [@channel]")


@router.message(Command("forcejoin"))
async def forcejoin_cmd(message: Message) -> None:
    global FORCE_JOIN_ACTIVE
    if not is_owner(message.from_user.id):
        return await message.answer("❌ You are not authorized.")
    
    args = message.text.split()[1:] if message.text else []
    if args and args[0].lower() == "on":
        FORCE_JOIN_ACTIVE = True
        await message.answer("🟢 Majburiy obuna yoqildi.")
    elif args and args[0].lower() == "off":
        FORCE_JOIN_ACTIVE = False
        await message.answer("🔴 Majburiy obuna o'chirildi.")
    else:
        status = "🟢 Yoqilgan" if FORCE_JOIN_ACTIVE else "🔴 O'chirilgan"
        await message.answer(f"Majburiy obuna holati: {status}\nO'zgartirish: /forcejoin on / off")


@router.message(Command("stats"))
async def stats_cmd(message: Message, session: AsyncSession = None) -> None:
    if not is_owner(message.from_user.id):
        return await message.answer("❌ You are not authorized.")
    
    uptime = int(time.perf_counter())
    
    user_count = 0
    download_count = 0
    if session:
        try:
            res_u = await session.execute(select(func.count(User.id)))
            user_count = res_u.scalar() or 0
            res_d = await session.execute(select(func.count(Download.id)))
            download_count = res_d.scalar() or 0
        except Exception:
            pass

    await message.answer(
        f"📊 <b>Bot Statistikasi</b>\n\n"
        f"👥 Foydalanuvchilar: <b>{user_count}</b>\n"
        f"📥 Yuklamalar: <b>{download_count}</b>\n"
        f"⏱ Bot Uptime: <b>{uptime}s</b>\n"
        f"🟢 Tizim holati: OK"
    )


@router.message(Command("users"))
async def users_cmd(message: Message, session: AsyncSession = None) -> None:
    if not is_owner(message.from_user.id):
        return await message.answer("❌ You are not authorized.")
    
    if not session:
        return await message.answer("👥 DB sessiyasi faol emas.")
    
    try:
        users = await UserRepository(session).get_all(limit=10)
        text = "👥 <b>Foydalanuvchilar (Oxirgi 10 ta):</b>\n\n"
        for u in users:
            text += f"• <code>{u.telegram_id}</code> | @{u.username or 'N/A'}\n"
        await message.answer(text)
    except Exception as exc:
        await message.answer(f"❌ Xatolik: {exc}")


@router.message(Command("ban"))
async def ban_cmd(message: Message, session: AsyncSession = None) -> None:
    if not is_owner(message.from_user.id):
        return await message.answer("❌ You are not authorized.")
    
    args = message.text.split()[1:] if message.text else []
    if not args:
        return await message.answer("Format: /ban [user_id]")
    
    try:
        user_id = int(args[0])
        if session:
            await UserRepository(session).set_banned(user_id, True)
        await message.answer(f"✅ Foydalanuvchi {user_id} bloklandi.")
    except Exception as exc:
        await message.answer(f"❌ Xatolik: {exc}")


@router.message(Command("unban"))
async def unban_cmd(message: Message, session: AsyncSession = None) -> None:
    if not is_owner(message.from_user.id):
        return await message.answer("❌ You are not authorized.")
    
    args = message.text.split()[1:] if message.text else []
    if not args:
        return await message.answer("Format: /unban [user_id]")
    
    try:
        user_id = int(args[0])
        if session:
            await UserRepository(session).set_banned(user_id, False)
        await message.answer(f"✅ Foydalanuvchi {user_id} blokdan chiqarildi.")
    except Exception as exc:
        await message.answer(f"❌ Xatolik: {exc}")
