import mongoose from 'mongoose';
import Blacklist from '../../models/Blacklist.js';
import logger from '../../config/logger.js';

export async function blacklistMiddleware(ctx, next) {
  if (!ctx.from) return next();

  const telegramId = ctx.from.id;

  if (ctx.state?.user?.isBanned) {
    logger.warn(`Banned user ${telegramId} blocked.`);
    return ctx.reply('⛔ *Hisobingiz bloklangan.*\n\nBotdan foydalanish huquqingiz cheklangan.', { parse_mode: 'Markdown' });
  }

  // Skip DB query if Mongoose is not in connected state
  if (mongoose.connection.readyState !== 1) {
    return next();
  }

  try {
    const isBlacklisted = await Blacklist.exists({ telegramId });
    if (isBlacklisted) {
      logger.warn(`Blacklisted ID ${telegramId} blocked.`);
      return ctx.reply('⛔ *Kirish taqiqlangan.*\n\nTelegram ID ingiz qora ro\'yxatga kiritilgan.', { parse_mode: 'Markdown' });
    }
  } catch (error) {
    logger.error(`Blacklist Middleware DB error: ${error.message}`);
    // Non-blocking: continue message flow if DB check fails
  }

  return next();
}
