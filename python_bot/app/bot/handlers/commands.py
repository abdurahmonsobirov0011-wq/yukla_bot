from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from app.bot.keyboards.inline import main_menu

router = Router(name="commands")


@router.message(Command("start", "boshlash"))
async def start(message: Message) -> None:
    await message.answer(
        "🌑 TezYukla Pro tayyor.\n\nHavola yuboring, musiqa nomini yozing yoki audio/video jo‘nating.",
        reply_markup=main_menu(),
    )


@router.message(Command("help", "yordam"))
async def help_cmd(message: Message) -> None:
    await message.answer(
        "/start - boshlash\n"
        "/search - musiqa/video qidirish\n"
        "/music - musiqa qidirish\n"
        "/video - video qidirish\n"
        "/shazam - audio/video orqali qo‘shiq aniqlash\n"
        "/profile - profil\n"
        "/premium - premium\n"
        "/admin - admin"
    )


@router.message(Command("settings", "sozlamalar"))
async def settings_cmd(message: Message) -> None:
    await message.answer("⚙️ Til: O‘zbekcha\nInterfeys: dark emoji\nBildirishnomalar: yoqilgan")


@router.message(Command("profile", "profil"))
async def profile_cmd(message: Message) -> None:
    user = message.from_user
    await message.answer(f"👤 Profil\nID: {user.id}\nUsername: @{user.username or '-'}")


@router.message(Command("premium"))
async def premium_cmd(message: Message) -> None:
    await message.answer("💎 Premium: katta fayllar, tezroq navbat, yuqori limitlar.")


@router.message(Command("history", "tarix"))
async def history_cmd(message: Message) -> None:
    await message.answer("🕘 Tarix admin panel va DB orqali saqlanadi.")


@router.message(Command("favorites", "sevimlilar"))
async def favorites_cmd(message: Message) -> None:
    await message.answer("⭐ Sevimlilar ro‘yxati tayyor.")

