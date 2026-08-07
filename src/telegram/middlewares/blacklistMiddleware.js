import { isDbConnected } from '../../config/database.js';
import localStore from '../../utils/localStore.js';
import Blacklist from '../../models/Blacklist.js';
import logger from '../../config/logger.js';

export async function blacklistMiddleware(ctx, next) {
  if (!ctx.from) return next();

  const telegramId = ctx.from.id;

  if (ctx.state?.user?.isBanned) {
    logger.warn(`Banned user ${telegramId} blocked.`);
    return ctx.reply('⛔ *Hisobingiz bloklangan.*\n\nBotdan foydalanish huquqingiz cheklangan.', { parse_mode: 'Markdown' });
  }

  // Fallback to local store if DB is disconnected
  if (!isDbConnected()) {
    if (localStore.isBlacklisted(telegramId)) {
      logger.warn(`Blacklisted ID ${telegramId} blocked via localStore.`);
      return ctx.reply('⛔ *Kirish taqiqlangan.*\n\nTelegram ID ingiz qora ro\'yxatga kiritilgan.', { parse_mode: 'Markdown' });
    }
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
  }

  return next();
}

