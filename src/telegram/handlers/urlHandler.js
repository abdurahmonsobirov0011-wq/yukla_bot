import { extractUrlFromText, detectPlatform } from '../../utils/urlDetector.js';
import { processDownload } from '../../services/downloaderService.js';
import { downloadYouTube } from '../../services/extractors/youtube.js';
import { getCachedMedia, setCachedMedia } from '../../utils/cache.js';
import { deleteFile } from '../../services/fileService.js';
import logger from '../../config/logger.js';
import env from '../../config/env.js';

export const downloadCache = new Map();

export async function handleUrlMessage(ctx) {
  const text = ctx.message?.text?.trim();
  if (!text) return;

  const url = extractUrlFromText(text);
  const botUsername = ctx.botInfo?.username || env.BOT_USERNAME || 'MediaDownloaderBot';
  const telegramId = ctx.from.id;

  // ==========================================
  // CASE A: TEXT SEARCH (Song name or Lyrics query)
  // ==========================================
  if (!url) {
    // If command like /start, ignore
    if (text.startsWith('/')) return;

    logger.info(`Song text search requested by ${telegramId}: "${text}"`);
    const statusMsg = await ctx.reply(`🔍 *"${text}"* bo'yicha musiqa qidirilmoqda...`, { parse_mode: 'Markdown' });

    let audioResult = null;
    try {
      // Search YouTube Music for text query or lyrics fragment
      const searchQuery = `ytsearch1:${text} audio`;
      audioResult = await downloadYouTube(searchQuery, 'audio');

      const inline_keyboard = [
        [
          { text: "➕ Guruhda ishlatish", url: `https://t.me/${botUsername}?startgroup=true` }
        ],
        [
          { text: "❌ O'chirish", callback_data: "delete_msg" }
        ]
      ];

      await ctx.replyWithAudio(
        { source: audioResult.filePath, filename: `${audioResult.title}.mp3` },
        {
          caption: `🎧 *Musiqa topildi:* ${audioResult.title}\n🤖 *@${botUsername}*`,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard }
        }
      );

      await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
    } catch (error) {
      logger.error(`Text song search error: ${error.message}`);
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        statusMsg.message_id,
        null,
        `❌ *Qo'shiqni topishda xatolik*\n\nSababi: ${error.message}\n\nIltimos, qo'shiq nomi yoki matnini aniqroq yozib qayta urinib ko'ring.`,
        { parse_mode: 'Markdown' }
      ).catch(() => {});
    } finally {
      if (audioResult && audioResult.filePath) {
        deleteFile(audioResult.filePath);
      }
    }
    return;
  }

  // ==========================================
  // CASE B: MEDIA URL DOWNLOAD (Social Media Link)
  // ==========================================
  const platform = detectPlatform(url);
  if (!platform) {
    return ctx.reply("⚠️ *Noto'g'ri havola.* Iltimos Instagram, YouTube, TikTok, Facebook, Pinterest yoki Snapchat havolasini yuboring.", { parse_mode: 'Markdown' });
  }

  const caption = `🤖 *@${botUsername} birinchi raqamli yuklovchi bot*`;

  // Generate cache key for callback buttons
  const cacheKey = `${telegramId}_${Date.now()}`;
  downloadCache.set(cacheKey, { url, platform });
  setTimeout(() => downloadCache.delete(cacheKey), 30 * 60 * 1000);

  const inline_keyboard = [
    [
      { text: "➕ Guruhda ishlatish", url: `https://t.me/${botUsername}?startgroup=true` }
    ],
    [
      { text: "📝 Tavsif", callback_data: `info_${cacheKey}` },
      { text: "🎵 MP3", callback_data: `mp3_${cacheKey}` }
    ],
    [
      { text: "🔍 Qo'shiqni topish", callback_data: `findsong_${cacheKey}` }
    ],
    [
      { text: "📁 Saqlash", callback_data: `save_${cacheKey}` },
      { text: "❌ O'chirish", callback_data: "delete_msg" }
    ]
  ];

  // 1. FAST PATH: Check Cache (Instant <1s response!)
  const cachedMedia = await getCachedMedia(url);
  if (cachedMedia && cachedMedia.fileId) {
    logger.info(`⚡ Responding instantly from CACHE for URL: ${url}`);

    if (cachedMedia.mediaType === 'audio') {
      return ctx.replyWithAudio(cachedMedia.fileId, { caption, parse_mode: 'Markdown', reply_markup: { inline_keyboard } });
    } else if (cachedMedia.mediaType === 'image') {
      return ctx.replyWithPhoto(cachedMedia.fileId, { caption, parse_mode: 'Markdown', reply_markup: { inline_keyboard } });
    } else {
      return ctx.replyWithVideo(cachedMedia.fileId, { caption, parse_mode: 'Markdown', supports_streaming: true, reply_markup: { inline_keyboard } });
    }
  }

  // 2. SLOW PATH: Download from source
  const statusMsg = await ctx.reply(`🔍 *${platform.toUpperCase()} havolasi aniqlandi*\n⚡ Yuklab olinmoqda, iltimos kuting...`, { parse_mode: 'Markdown' });

  let downloadResult = null;
  let sentMsg = null;

  try {
    downloadResult = await processDownload({
      telegramId,
      url,
      requestedFormat: 'video'
    });

    if (downloadResult.isWebDownload) {
      const sizeMb = (downloadResult.fileSize / (1024 * 1024)).toFixed(1);
      const webKeyboard = [
        [
          { text: "⚡ Bevosita Yuklab Olish (Direct Link)", url: downloadResult.webUrl }
        ],
        [
          { text: "➕ Guruhda ishlatish", url: `https://t.me/${botUsername}?startgroup=true` }
        ],
        [
          { text: "❌ O'chirish", callback_data: "delete_msg" }
        ]
      ];

      sentMsg = await ctx.reply(
        `📦 *Fayl hajmi:* ${sizeMb} MB (Telegram API 50MB limitidan yuqori)\n\n` +
        `📥 *Telegram cheklovi sababli to'g'ridan-to'g'ri yuklab olish havolasi yaratildi:*\n` +
        `🔗 [Faylni yuklab olish uchun bosing](${downloadResult.webUrl})\n\n` +
        `🤖 *@${botUsername}*`,
        { parse_mode: 'Markdown', reply_markup: { inline_keyboard: webKeyboard } }
      );
    } else if (downloadResult.mediaType === 'audio') {
      sentMsg = await ctx.replyWithAudio(
        { source: downloadResult.filePath, filename: downloadResult.fileName },
        { caption, parse_mode: 'Markdown', reply_markup: { inline_keyboard } }
      );
    } else if (downloadResult.mediaType === 'image') {
      sentMsg = await ctx.replyWithPhoto(
        { source: downloadResult.filePath },
        { caption, parse_mode: 'Markdown', reply_markup: { inline_keyboard } }
      );
    } else {
      sentMsg = await ctx.replyWithVideo(
        { source: downloadResult.filePath },
        { caption, parse_mode: 'Markdown', supports_streaming: true, reply_markup: { inline_keyboard } }
      );
    }

    let fileId = null;
    if (sentMsg.video) fileId = sentMsg.video.file_id;
    else if (sentMsg.audio) fileId = sentMsg.audio.file_id;
    else if (sentMsg.photo && sentMsg.photo.length) fileId = sentMsg.photo[sentMsg.photo.length - 1].file_id;

    if (fileId) {
      await setCachedMedia(url, {
        fileId,
        mediaType: downloadResult.mediaType,
        platform,
        title: downloadResult.title
      });
    }

    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});

  } catch (error) {
    logger.error(`Error processing URL message: ${error.message}`);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      null,
      `❌ *Yuklab olishda xatolik*\n\nSababi: ${error.message}\n\nIltimos, havolani tekshirib qayta yuboring.`,
      { parse_mode: 'Markdown' }
    ).catch(() => {});
  } finally {
    if (downloadResult && downloadResult.filePath && !downloadResult.isWebDownload) {
      deleteFile(downloadResult.filePath);
    }
  }
}

