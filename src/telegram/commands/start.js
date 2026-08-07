export async function handleStart(ctx) {
  const name = ctx.from?.first_name || 'Foydalanuvchi';

  const welcomeMessage = `
Assalomu alaykum, *${name}*! 👋

Sizga eng so'ngi xitlarni va qo'shiqlarni topib beradi 🔥

• *Instagram* - post, stories, reels;
• *YouTube* - video, shorts, audio;
• *Tik Tok* - suv belgisiz video;
• *Facebook* - reels, rasm, video;
• *Pinterest* - rasm, video;
• *Snapchat* - rasm, video;
🎵 *Musiqa Qidiruv* - Qo'shiq nomi yoki matnini yuboring!
🎧 *Shazam* - Ovozli xabar yuborib musiqani toping!

🤖 *BIZNING BOT ORQALI* yuqoridagi platformalardan videolarni yuklab olishingiz va har qanday qo'shiqni tezkor qidirib MP3 yuklashingiz mumkin.

🚀 *Ishlatish uchun:* Link, Qo'shiq nomi yoki Ovozli xabar yuboring!
`;

  return ctx.reply(welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '⭐ Premium Xarid Qilish', callback_data: 'cmd_premium' },
          { text: '🎁 Do\'stlarni Taklif Qilish', callback_data: 'cmd_referral' }
        ],
        [
          { text: '❓ Yordam va Qo\'llanma', callback_data: 'cmd_help' },
          { text: '📊 Statistika', callback_data: 'cmd_stats' }
        ]
      ]
    }
  });
}
