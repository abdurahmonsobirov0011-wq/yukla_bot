import mongoose from 'mongoose';
import User from '../../models/User.js';

export async function handleProfile(ctx) {
  const telegramId = ctx.from?.id;
  const user = ctx.state?.user;

  let downloadCount = user?.downloadCount || 0;
  let referralCount = user?.referralCount || 0;
  let isPremium = user?.isPremium || false;

  if (mongoose.connection.readyState === 1) {
    const dbUser = await User.findOne({ telegramId });
    if (dbUser) {
      downloadCount = dbUser.downloadCount;
      referralCount = dbUser.referralCount;
      isPremium = dbUser.isPremium;
    }
  }

  const message = `
👤 *Sizning Shaxsiy Profilingiz*

• Telegram ID: \`${telegramId}\`
• Ismingiz: *${ctx.from?.first_name || 'Foydalanuvchi'}*
• Nikneymingiz: @${ctx.from?.username || 'Yo\'q'}
• Obuna Ta'rifi: ${isPremium ? '⭐ *Premium Member*' : '🆓 Oddiy'}
• Jami Yuklamalar Soni: *${downloadCount} ta*
• Taklif Qilingan Do'stlar: *${referralCount} ta*
• Referral Kodingiz: \`${user?.referralCode || 'FREE'}\`

🚀 Premium imkoniyatlarni faollashtirish uchun /premium bo'limiga o'ting.
`;

  return ctx.reply(message, { parse_mode: 'Markdown' });
}
