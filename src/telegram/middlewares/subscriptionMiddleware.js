import env from '../../config/env.js';
import { getBotSettings } from '../../services/settingsService.js';
import logger from '../../config/logger.js';

function normalizeChannel(channel) {
  const value = String(channel || '').trim();
  if (!value) return '';
  return value.startsWith('@') || value.startsWith('-100') ? value : `@${value}`;
}

function channelUrl(channel) {
  const normalized = normalizeChannel(channel);
  if (normalized.startsWith('@')) {
    return `https://t.me/${normalized.slice(1)}`;
  }
  return undefined;
}

export async function subscriptionMiddleware(ctx, next) {
  if (!ctx.from) return next();

  if (env.ADMIN_IDS.includes(ctx.from.id)) {
    return next();
  }

  const settings = await getBotSettings();

  if (settings.maintenanceMode) {
    return ctx.reply(settings.maintenanceMessage || 'Botda texnik ishlar olib borilmoqda.');
  }

  const channels = (settings.forcedChannels || []).map(normalizeChannel).filter(Boolean);
  if (!settings.subscriptionRequired || channels.length === 0) {
    return next();
  }

  const missingChannels = [];

  for (const channel of channels) {
    try {
      const member = await ctx.telegram.getChatMember(channel, ctx.from.id);
      if (['left', 'kicked'].includes(member.status)) {
        missingChannels.push(channel);
      }
    } catch (error) {
      logger.warn(`Forced channel check failed for ${channel}: ${error.message}`);
      missingChannels.push(channel);
    }
  }

  if (missingChannels.length === 0) {
    return next();
  }

  const inline_keyboard = missingChannels.map(channel => {
    const url = channelUrl(channel);
    return [{ text: `Kanalga obuna bo‘lish: ${channel}`, ...(url ? { url } : { callback_data: 'noop' }) }];
  });
  inline_keyboard.push([{ text: '✅ Obunani tekshirish', callback_data: 'check_subscription' }]);

  return ctx.reply(
    '🔒 Botdan foydalanish uchun avval quyidagi kanal(lar)ga obuna bo‘ling.\n\nObuna bo‘lgach, “Obunani tekshirish” tugmasini bosing.',
    { reply_markup: { inline_keyboard } }
  );
}
