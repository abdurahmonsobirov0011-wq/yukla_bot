import mongoose from 'mongoose';
import ForcedChannel from '../../../models/ForcedChannel.js';
import env from '../../../config/env.js';
import logger from '../../../config/logger.js';
import { isOwner } from '../../middlewares/adminMiddleware.js';

// In-Memory store for channels when MongoDB is offline
export const memoryChannels = new Map();

export async function getActiveForcedChannels() {
  if (mongoose.connection.readyState === 1) {
    try {
      const dbChannels = await ForcedChannel.find({ isActive: true });
      return dbChannels.map(c => ({ channelId: c.channelId, channelTitle: c.channelTitle }));
    } catch (err) {
      logger.warn(`Failed to fetch forced channels from DB: ${err.message}`);
    }
  }

  // Memory fallback
  return Array.from(memoryChannels.values()).filter(c => c.isActive);
}

export async function handleChannel(ctx) {
  if (!isOwner(ctx)) return ctx.reply("❌ Sizda ruxsat yo'q.");

  const text = ctx.message?.text || '';
  const parts = text.split(' ').filter(Boolean);
  const action = parts[1];
  let channelId = parts[2];

  if (!action) {
    return ctx.reply("❌ Noto'g'ri buyruq. Format:\n`/channel add @kanal`\n`/channel remove @kanal`\n`/channel list`\n`/channel status`", { parse_mode: 'Markdown' });
  }

  // Normalize channel handle e.g. https://t.me/stteamuz or @stteamuz -> @stteamuz
  if (channelId) {
    channelId = channelId.replace(/https?:\/\/t\.me\//i, '@').trim();
    if (!channelId.startsWith('@') && !channelId.startsWith('-100')) {
      channelId = `@${channelId}`;
    }
  }

  try {
    // 1. ADD CHANNEL
    if (action === 'add') {
      if (!channelId) {
        return ctx.reply("❌ Kanal nomini kiriting. Masalan: `/channel add @stteamuz`", { parse_mode: 'Markdown' });
      }

      let title = channelId;
      try {
        const chatInfo = await ctx.telegram.getChat(channelId);
        title = chatInfo.title || channelId;
      } catch (err) {
        logger.warn(`Could not fetch chat title for ${channelId}: ${err.message}`);
      }

      memoryChannels.set(channelId.toLowerCase(), {
        channelId,
        channelTitle: title,
        isActive: true,
        addedAt: new Date()
      });

      if (mongoose.connection.readyState === 1) {
        await ForcedChannel.findOneAndUpdate(
          { channelId },
          { channelId, channelTitle: title, isActive: true },
          { upsert: true }
        ).catch(() => {});
      }

      return ctx.reply(`✅ *Kanal majburiy obunaga qo'shildi!*\n\n📢 Kanal: *${title}* (\`${channelId}\`)`, { parse_mode: 'Markdown' });
    }

    // 2. REMOVE CHANNEL
    else if (action === 'remove') {
      if (!channelId) {
        return ctx.reply("❌ Kanal nomini kiriting. Masalan: `/channel remove @stteamuz`", { parse_mode: 'Markdown' });
      }

      memoryChannels.delete(channelId.toLowerCase());

      if (mongoose.connection.readyState === 1) {
        await ForcedChannel.findOneAndDelete({ channelId }).catch(() => {});
      }

      return ctx.reply(`✅ *Kanal majburiy obunadan o'chirildi:* \`${channelId}\``, { parse_mode: 'Markdown' });
    }

    // 3. LIST CHANNELS
    else if (action === 'list') {
      const channels = await getActiveForcedChannels();

      if (channels.length === 0) {
        return ctx.reply("📋 *Majburiy obuna kanallari ro'yxati:* Hali birorta ham kanal qo'shilmagan.\n\nKanal qo'shish uchun: `/channel add @kanal`", { parse_mode: 'Markdown' });
      }

      let msg = "📋 *Majburiy obuna kanallari ro'yxati:*\n\n";
      channels.forEach((ch, idx) => {
        msg += `${idx + 1}. 🟢 *${ch.channelTitle}* (\`${ch.channelId}\`)\n`;
      });

      return ctx.reply(msg, { parse_mode: 'Markdown' });
    }

    // 4. STATUS
    else if (action === 'status') {
      const channels = await getActiveForcedChannels();
      return ctx.reply(`📊 *Majburiy obuna statusi:*\n\nFaol kanallar soni: *${channels.length} ta*`, { parse_mode: 'Markdown' });
    }

    else {
      return ctx.reply("❌ Noto'g'ri buyruq. Format:\n`/channel add @kanal`\n`/channel remove @kanal`\n`/channel list`\n`/channel status`", { parse_mode: 'Markdown' });
    }
  } catch (error) {
    logger.error(`Channel command error: ${error.message}`);
    return ctx.reply(`❌ Xatolik yuz berdi: ${error.message}`);
  }
}
