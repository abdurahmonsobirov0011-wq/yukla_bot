import logger from '../../config/logger.js';

// Memory rate limit map
const userRequestTimestamps = new Map();

export async function rateLimitMiddleware(ctx, next) {
  if (!ctx.from) return next();

  const telegramId = ctx.from.id;
  const isPremium = ctx.state?.user?.isPremium || false;
  const minInterval = isPremium ? 1000 : 3000; // ms

  const now = Date.now();
  const lastTime = userRequestTimestamps.get(telegramId) || 0;

  if (now - lastTime < minInterval) {
    const waitSec = Math.ceil((minInterval - (now - lastTime)) / 1000);
    logger.warn(`Rate limit triggered for user ${telegramId}`);
    return ctx.reply(`⚠️ *Biroz kuting!* Yangi so'rov yuborishdan oldin *${waitSec} soniya* kuting.\n\n⭐ *Maslahat:* Tezroq yuklash va cheklovlarsiz foydalanish uchun /premium bo'limiga o'ting!`, { parse_mode: 'Markdown' });
  }

  userRequestTimestamps.set(telegramId, now);
  return next();
}
