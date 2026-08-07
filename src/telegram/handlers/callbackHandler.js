import { handleHelp } from '../commands/help.js';
import { handleStats } from '../commands/stats.js';
import { handlePremium } from '../commands/premium.js';
import { handleReferral } from '../commands/referral.js';
import { downloadCache } from './urlHandler.js';
import { processDownload, identifyAndDownloadSong } from '../../services/downloaderService.js';
import { deleteFile } from '../../services/fileService.js';
import logger from '../../config/logger.js';
import env from '../../config/env.js';

export async function handleCallbackQuery(ctx) {
  const data = ctx.callbackQuery?.data;
  if (!data) return;

  try {
    // Delete Message action
    if (data === 'delete_msg') {
      await ctx.answerCbQuery('O\'chirildi');
      return ctx.deleteMessage().catch(() => {});
    }

    if (data === 'check_subscription') {
      await ctx.answerCbQuery('Tekshirilmoqda...');
      return ctx.reply('✅ Rahmat. Endi botdan foydalanish uchun havola yoki musiqa yuboring.');
    }

    if (data === 'noop') {
      return ctx.answerCbQuery('Bu kanal uchun link berilmagan. Admin kanal username kiritishi kerak.', { show_alert: true });
    }

    // MP3 extraction action (direct audio from this video)
    if (data.startsWith('mp3_')) {
      const cacheKey = data.replace('mp3_', '');
      const cached = downloadCache.get(cacheKey);

      await ctx.answerCbQuery('🎵 MP3 audio ajratib olinmoqda...');

      if (!cached || !cached.url) {
        return ctx.reply('⚠️ *Kechirasiz, audio tayyorlash muddati o\'tib ketgan.* Iltimos havolani qayta yuboring.', { parse_mode: 'Markdown' });
      }

      const statusMsg = await ctx.reply('🎵 *Videodan MP3 audio ajratib olinmoqda...*', { parse_mode: 'Markdown' });

      let audioResult = null;
      try {
        audioResult = await processDownload({
          telegramId: ctx.from.id,
          url: cached.url,
          requestedFormat: 'audio'
        });

        const botUsername = ctx.botInfo?.username || env.BOT_USERNAME || 'MediaDownloaderBot';
        await ctx.replyWithAudio(
          { source: audioResult.filePath, filename: `${cached.platform}_audio.mp3` },
          { caption: `🎵 *${cached.platform.toUpperCase()} Qo'shig'i (MP3)*\n🤖 *@${botUsername}*`, parse_mode: 'Markdown' }
        );

        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
      } catch (err) {
        logger.error(`MP3 extraction error: ${err.message}`);
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          null,
          `❌ *MP3 ajratishda xatolik:* ${err.message}`,
          { parse_mode: 'Markdown' }
        );
      } finally {
        if (audioResult && audioResult.filePath) {
          deleteFile(audioResult.filePath);
        }
      }
      return;
    }

    // Song Finder action (identifies & downloads the full original song track)
    if (data.startsWith('findsong_')) {
      const cacheKey = data.replace('findsong_', '');
      const cached = downloadCache.get(cacheKey);

      await ctx.answerCbQuery('🔍 Videodagi qo\'shiq qidirilmoqda...');

      if (!cached || !cached.url) {
        return ctx.reply('⚠️ *Kechirasiz, havola vaqti tugagan.* Iltimos havolani qayta yuboring.', { parse_mode: 'Markdown' });
      }

      const statusMsg = await ctx.reply('🎧 *Videoda ishlatilgan qo\'shiqning asl varianti qidirilmoqda...*', { parse_mode: 'Markdown' });

      let songResult = null;
      try {
        songResult = await identifyAndDownloadSong(cached.url);

        const botUsername = ctx.botInfo?.username || env.BOT_USERNAME || 'MediaDownloaderBot';
        await ctx.replyWithAudio(
          { source: songResult.filePath, filename: `${songResult.songTitle}.mp3` },
          { caption: `🎧 *Topilgan Asl Qo'shiq:* ${songResult.songTitle}\n🤖 *@${botUsername}*`, parse_mode: 'Markdown' }
        );

        await ctx.telegram.deleteMessage(ctx.chat.id, statusMsg.message_id).catch(() => {});
      } catch (err) {
        logger.error(`Song finder error: ${err.message}`);
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          statusMsg.message_id,
          null,
          `❌ *Qo'shiqni topishda xatolik:* ${err.message}`,
          { parse_mode: 'Markdown' }
        );
      } finally {
        if (songResult && songResult.filePath) {
          deleteFile(songResult.filePath);
        }
      }
      return;
    }

    // Info/Tavsif action
    if (data.startsWith('info_')) {
      const cacheKey = data.replace('info_', '');
      const cached = downloadCache.get(cacheKey);
      const description = cached
        ? `Platforma: ${cached.platform?.toUpperCase() || 'MEDIA'}`
        : 'Media tavsifi topilmadi';
      await ctx.answerCbQuery(description, { show_alert: true });
      return;
    }

    // Save action
    if (data.startsWith('save_')) {
      await ctx.answerCbQuery('✅ Media muvaffaqiyatli saqlandi!', { show_alert: true });
      return;
    }

    // Verify force join callback
    if (data === 'verify_join') {
      const mongoose = (await import('mongoose')).default;
      if (mongoose.connection.readyState !== 1) {
        await ctx.answerCbQuery('✅ Tasdiqlandi!');
        return ctx.reply('✅ Botdan foydalanishingiz mumkin. Havola yoki qo\'shiq nomini yuboring!');
      }
      const ForcedChannel = (await import('../../models/ForcedChannel.js')).default;
      const channels = await ForcedChannel.find({ isActive: true });
      let allJoined = true;
      for (const ch of channels) {
        try {
          const member = await ctx.telegram.getChatMember(ch.channelId, ctx.from.id);
          if (['left', 'kicked'].includes(member.status)) {
            allJoined = false;
            break;
          }
        } catch {
          allJoined = false;
          break;
        }
      }
      if (allJoined) {
        await ctx.answerCbQuery('✅ Tasdiqlandi!');
        await ctx.deleteMessage().catch(() => {});
        return ctx.reply('✅ Rahmat! Barcha kanallarga obuna bo\'lgansiz. Endi botdan foydalanishingiz mumkin!');
      } else {
        return ctx.answerCbQuery('❌ Siz hali barcha kanallarga obuna bo\'lmadingiz!', { show_alert: true });
      }
    }

    // Language switch callbacks
    if (data.startsWith('lang_')) {
      const lang = data.replace('lang_', '');
      await ctx.answerCbQuery(`✅ Til o'zgartirildi: ${lang.toUpperCase()}`);
      return;
    }

    // Default Command callbacks
    await ctx.answerCbQuery();
    switch (data) {
      case 'cmd_help':
        return handleHelp(ctx);
      case 'cmd_stats':
        return handleStats(ctx);
      case 'cmd_premium':
        return handlePremium(ctx);
      case 'cmd_referral':
        return handleReferral(ctx);
      default:
        logger.info(`Unhandled callback: ${data}`);
    }
  } catch (error) {
    logger.error(`Error handling callback query ${data}: ${error.message}`);
  }
}
