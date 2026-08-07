import { getUserStats, getDashboardStats } from '../../services/statsService.js';

export async function handleStats(ctx) {
  const telegramId = ctx.from?.id;
  if (!telegramId) return;

  const [uStats, gStats] = await Promise.all([
    getUserStats(telegramId),
    getDashboardStats()
  ]);

  if (!uStats) {
    return ctx.reply('Statistika ma\'lumotlarini olishda xatolik yuz berdi.');
  }

  const message = `
📊 *Statistika Umumiy Ko'rinishi*

👤 *Sizning Profilingiz:*
• ID: \`${uStats.telegramId}\`
• Obuna Ta'rifi: ${uStats.isPremium ? '⭐ *Premium*' : '🆓 Oddiy'}
• Jami Yuklamalaringiz: *${uStats.downloadCount} ta*
• Taklif Qilgan Do'stlaringiz: *${uStats.referralCount} ta*
• Qo'shilgan Sana: ${new Date(uStats.joinedAt).toLocaleDateString()}

🌐 *Botning Umumiy Ko'rsatkichlari:*
• Ro'yxatdan O'tgan Jami Foydalanuvchilar: *${gStats.totalUsers}*
• Bugungi Faol Foydalanuvchilar: *${gStats.dailyActiveUsers}*
• Bugungi Yuklamalar Soni: *${gStats.downloadsToday}*
• Shu Oydagi Yuklamalar: *${gStats.downloadsThisMonth}*
• Eng Ko'p Yuklangan Tarmoq: *${gStats.mostUsedPlatform.toUpperCase()}*
• Server Holati: 🟢 *Onlayn (Ishlamoqda)*
`;

  return ctx.reply(message, { parse_mode: 'Markdown' });
}
