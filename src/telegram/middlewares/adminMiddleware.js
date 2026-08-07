import env from '../../config/env.js';
import logger from '../../config/logger.js';

export function isOwner(ctx) {
  if (!ctx.from) return false;
  return env.ADMIN_IDS.includes(ctx.from.id.toString()) || env.ADMIN_IDS.includes(ctx.from.id);
}

export function ownerOnly(ctx, next) {
  if (!isOwner(ctx)) {
    return ctx.reply("❌ Sizda ruxsat yo'q.");
  }
  return next();
}
