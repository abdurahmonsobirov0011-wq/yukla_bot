import logging
import secrets
import time
from pathlib import Path

from aiogram import Bot, F, Router
from aiogram.types import CallbackQuery, FSInputFile, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.keyboards.inline import quality_menu
from app.models import Download
from app.repositories.downloads import DownloadRepository
from app.services.downloaders.ytdlp import YtDlpDownloader
from app.services.recognition import MusicRecognitionService
from app.services.search import SearchService
from app.utils.platforms import detect_platform, extract_url

logger = logging.getLogger(__name__)
router = Router(name="media")
URL_CACHE: dict[str, str] = {}
CANCELLED: set[str] = set()


@router.message(F.text)
async def text_handler(message: Message) -> None:
    text = message.text or ""
    url = extract_url(text)
    if url:
        platform = detect_platform(url)
        if not platform:
            return await message.answer("⚠️ Bu havola qo‘llab-quvvatlanmaydi.")
        key = secrets.token_urlsafe(8)
        URL_CACHE[key] = url
        info_msg = await message.answer("🔍 Havola tekshirilyapti...")
        try:
            info = await YtDlpDownloader().probe(url)
            await info_msg.edit_text(
                f"✅ {platform.value.upper()}\n🎬 {info.title}\n⏱ {info.duration or '-'}s\nSifatni tanlang:",
                reply_markup=quality_menu(key),
            )
        except Exception as exc:
            await info_msg.edit_text(f"❌ Media ma’lumotini olishda xatolik: {exc}")
        return
    if text.startswith("/"):
        return
    status = await message.answer("🤖 Aqlli qidiruv ishlayapti...")
    try:
        song = await SearchService().song(text)
        await status.edit_text(
            f"🎧 {song.artist} - {song.title}\n"
            f"💿 {song.album or '-'}\n"
            f"⏱ {song.duration or '-'}s\n"
            f"Spotify: {song.spotify_url or '-'}"
        )
    except Exception as exc:
        await status.edit_text(f"❌ Qidiruv xatosi: {exc}")


@router.callback_query(F.data.startswith("dl:"))
async def download_callback(callback: CallbackQuery, session: AsyncSession) -> None:
    _, key, media_type, quality = callback.data.split(":", 3)
    url = URL_CACHE.get(key)
    if not url:
        return await callback.answer("Havola muddati tugagan", show_alert=True)
    await callback.answer("Yuklab olish boshlandi")
    status = await callback.message.answer("⬛⬛⬛⬛⬛ 0%")
    started = time.perf_counter()
    result = None
    try:
        await status.edit_text("🟦⬛⬛⬛⬛ 20%: manbadan olinmoqda")
        result = await YtDlpDownloader().download(url, quality=quality, media_type=media_type)
        if key in CANCELLED:
            CANCELLED.remove(key)
            return await status.edit_text("❌ Bekor qilindi")
        await status.edit_text("🟦🟦🟦🟦⬛ 80%: Telegramga yuborilmoqda")
        input_file = FSInputFile(result.path, filename=result.file_name)
        if result.media_type == "audio":
            sent = await callback.message.answer_audio(input_file, caption=f"🎧 {result.title}")
            file_id = sent.audio.file_id
        elif result.media_type == "image":
            sent = await callback.message.answer_photo(input_file, caption=f"🖼 {result.title}")
            file_id = sent.photo[-1].file_id
        else:
            sent = await callback.message.answer_video(input_file, caption=f"🎬 {result.title}", supports_streaming=True)
            file_id = sent.video.file_id
        await DownloadRepository(session).set_cache(url, result.platform, result.media_type, quality, file_id, result.title, result.file_size)
        await DownloadRepository(session).log(
            Download(
                telegram_id=callback.from_user.id,
                platform=result.platform,
                source_url=url,
                media_type=result.media_type,
                quality=quality,
                file_size=result.file_size,
                processing_ms=int((time.perf_counter() - started) * 1000),
            )
        )
        await status.delete()
    except Exception as exc:
        logger.exception("Download failed")
        await DownloadRepository(session).log(
            Download(
                telegram_id=callback.from_user.id,
                platform="unknown",
                source_url=url,
                media_type=media_type,
                quality=quality,
                status="failed",
                error=str(exc),
                processing_ms=int((time.perf_counter() - started) * 1000),
            )
        )
        await status.edit_text(f"❌ Yuklab olishda xatolik: {exc}")
    finally:
        if result:
            result.path.unlink(missing_ok=True)


@router.callback_query(F.data.startswith("cancel:"))
async def cancel_callback(callback: CallbackQuery) -> None:
    key = callback.data.split(":", 1)[1]
    CANCELLED.add(key)
    await callback.answer("Bekor qilish so‘rovi yuborildi", show_alert=True)


@router.message(F.voice | F.audio | F.video)
async def recognize_handler(message: Message, bot: Bot) -> None:
    media = message.voice or message.audio or message.video
    status = await message.answer("🎧 Shazam aniqlayapti...")
    file = await bot.get_file(media.file_id)
    local_path = Path("downloads") / f"recognize_{message.from_user.id}_{media.file_unique_id}.bin"
    await bot.download_file(file.file_path, destination=local_path)
    try:
        song = await MusicRecognitionService().recognize(local_path)
        await status.edit_text(
            f"✅ Topildi\n🎧 {song.artist} - {song.title}\n💿 {song.album or '-'}\n"
            f"📅 {song.release_year or '-'}\n🎼 {song.genre or '-'}\n"
            f"Spotify: {song.spotify_url or '-'}\nApple Music: {song.apple_music_url or '-'}\n"
            f"Ishonch: {song.confidence:.0%}"
        )
    except Exception as exc:
        await status.edit_text(f"❌ Qo‘shiq aniqlanmadi: {exc}")
    finally:
        local_path.unlink(missing_ok=True)

