import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getActiveForcedChannels } from '../commands/admin/channel.js';

export async function forceJoinCheck(ctx, next) {
  // Always bypass force-join check for Admin / Owner
  if (ctx.from && (env.ADMIN_IDS.includes(ctx.from.id.toString()) || env.ADMIN_IDS.includes(ctx.from.id))) {
    return next();
  }

  try {
    const channels = await getActiveForcedChannels();
    
    if (!channels || channels.length === 0) {
      return next();
    }

    const notJoinedChannels = [];

    for (const channel of channels) {
      try {
        const member = await ctx.telegram.getChatMember(channel.channelId, ctx.from.id);
        const activeStatuses = ['creator', 'administrator', 'member'];
        if (!activeStatuses.includes(member.status)) {
          notJoinedChannels.push(channel);
        }
      } catch (err) {
        logger.warn(`Could not check membership for user ${ctx.from.id} in channel ${channel.channelId}: ${err.message}`);
        // If bot is admin in channel, user is not member
        notJoinedChannels.push(channel);
      }
    }

    if (notJoinedChannels.length > 0) {
      const inline_keyboard = notJoinedChannels.map(ch => [
        { text: `📢 ${ch.channelTitle || ch.channelId}`, url: `https://t.me/${ch.channelId.replace('@', '')}` }
      ]);

      inline_keyboard.push([{ text: '✅ Obuna bo\'ldim (Tekshirish)', callback_data: 'verify_join' }]);

      return ctx.reply("⚠️ *Botdan foydalanish uchun quyidagi kanallarga obuna bo'ling:*", {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard }
      });
    }

    return next();
  } catch (error) {
    logger.error(`Force join middleware error: ${error.message}`);
    return next();
  }
}
