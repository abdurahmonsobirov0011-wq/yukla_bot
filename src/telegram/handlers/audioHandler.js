import axios from 'axios';
import fs from 'fs';
import path from 'path';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { deleteFile } from '../../services/fileService.js';
import { recognizeAndDownloadMusic } from '../../services/shazamService.js';

export async function handleAudioOrVoice(ctx) {
  const voice = ctx.message?.voice;
  const audio = ctx.message?.audio;
  const fileObj = voice || audio;

  if (!fileObj) return;

  const telegramId = ctx.from.id;
  const botUsername = ctx.botInfo?.username || env.BOT_USERNAME || 'MediaDownloaderBot';

  const statusMsg = await ctx.reply('🎧 *Musiqa eshitilmoqda (Shazam qidiruv)...*\nIltimos biroz kuting...', { parse_mode: 'Markdown' });

  let tempInputPath = null;
  let songResult = null;

  try {
    // Get file download URL from Telegram API
    const link = await ctx.telegram.getFileLink(fileObj.file_id);
    tempInputPath = path.join(env.DOWNLOAD_PATH, `shazam_${Date.now()}.${voice ? 'ogg' : 'mp3'}`);

    // Download audio file to local temp storage
    const writer = fs.createWriteStream(tempInputPath);
    const response = await axios({ url: link.href, method: 'GET', responseType: 'stream' });
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Recognize music & download full MP3 track
    songResult = await recognizeAndDownloadMusic(tempInputPath);

    const inline_keyboard = [
      [
        { text: "➕ Guruhda ishlatish", url: `https://t.me/${botUsername}?startgroup=true` }
      ],
      [
        { text: "❌ O'chirish", callback_data: "delete_msg" }
      ]
    ];

    await ctx.replyWithAudio(
      { source: songResult.filePath, filename: `${songResult.songTitle}.mp3` },
      {
        caption: `🎧 *Shazam bo'yicha topildi:* ${songResult.songTitle}\n🤖 *@${botUsername}*`,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      }
    );

    await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
  } catch (error) {
    logger.error(`Shazam audio handler error: ${error.message}`);
    await ctx.telegram.editMessageText(
      ctx.chat.id,
      statusMsg.message_id,
      null,
      `❌ *Qo'shiqni aniqlab bo'lmadi*\n\nSababi: ${error.message}\n\nIltimos, musiqani aniqroq qismini (ovozli xabar yoki mp3) qayta yuboring.`,
      { parse_mode: 'Markdown' }
    ).catch(() => {});
  } finally {
    if (tempInputPath) deleteFile(tempInputPath);
    if (songResult && songResult.filePath) deleteFile(songResult.filePath);
  }
}
