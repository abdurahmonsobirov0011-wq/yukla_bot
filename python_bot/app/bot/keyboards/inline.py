from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def main_menu() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🔎 Qidiruv", callback_data="cmd:search"),
                InlineKeyboardButton(text="🎧 Shazam", callback_data="cmd:shazam"),
            ],
            [
                InlineKeyboardButton(text="🕘 Tarix", callback_data="cmd:history"),
                InlineKeyboardButton(text="⭐ Sevimlilar", callback_data="cmd:favorites"),
            ],
            [
                InlineKeyboardButton(text="💎 Premium", callback_data="cmd:premium"),
                InlineKeyboardButton(text="⚙️ Sozlamalar", callback_data="cmd:settings"),
            ],
        ]
    )


def quality_menu(url_key: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="360p", callback_data=f"dl:{url_key}:video:360"),
                InlineKeyboardButton(text="720p", callback_data=f"dl:{url_key}:video:720"),
                InlineKeyboardButton(text="1080p", callback_data=f"dl:{url_key}:video:1080"),
            ],
            [
                InlineKeyboardButton(text="4K", callback_data=f"dl:{url_key}:video:4k"),
                InlineKeyboardButton(text="MP3 192", callback_data=f"dl:{url_key}:audio:192"),
                InlineKeyboardButton(text="MP3 320", callback_data=f"dl:{url_key}:audio:320"),
            ],
            [InlineKeyboardButton(text="❌ Bekor qilish", callback_data=f"cancel:{url_key}")],
        ]
    )


def subscription_menu(channels: list[str]) -> InlineKeyboardMarkup:
    rows = [[InlineKeyboardButton(text=f"Kanal: {ch}", url=f"https://t.me/{ch.lstrip('@')}")] for ch in channels]
    rows.append([InlineKeyboardButton(text="✅ Tekshirish", callback_data="check_subscription")])
    return InlineKeyboardMarkup(inline_keyboard=rows)

