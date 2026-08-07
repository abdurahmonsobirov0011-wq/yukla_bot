import mongoose from 'mongoose';
import Favorite from '../../models/Favorite.js';

export async function handleFavorites(ctx) {
  const telegramId = ctx.from?.id;

  if (mongoose.connection.readyState !== 1) {
    return ctx.reply('⭐ *Tanlanganlar (Izlanmalar)*\n\nHali saqlangan medialaringiz yo\'q.', { parse_mode: 'Markdown' });
  }

  const favorites = await Favorite.find({ telegramId }).limit(10);

  if (!favorites.length) {
    return ctx.reply('⭐ *Tanlanganlar Ro\'yxati*\n\nHali birorta ham faylni tanlanganlarga saqlamagansiz. Video ostidagi "📁 Saqlash" tugmasini bosib saqlashingiz mumkin.', { parse_mode: 'Markdown' });
  }

  let text = '⭐ *Sizning Saqlangan Medialaringiz:*\n\n';
  favorites.forEach((fav, idx) => {
    text += `${idx + 1}. *${fav.title || 'Media'}* (${fav.platform})\n`;
  });

  return ctx.reply(text, { parse_mode: 'Markdown' });
}
