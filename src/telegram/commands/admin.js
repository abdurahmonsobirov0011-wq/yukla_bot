import { isOwner } from '../middlewares/adminMiddleware.js';

export async function handleAdmin(ctx) {
  if (!isOwner(ctx)) {
    return ctx.reply("❌ Sizda ruxsat yo'q.");
  }

  const message = `
👑 *Admin Boshqaruv Paneli*

Hush kelibsiz, Admin! Quyidagi tugmalar orqali botni to'liq boshqarishingiz mumkin:
`;

  return ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        [
          { text: '📢 Reklama / Yangilik tarqatish' },
          { text: '📊 Bot statistikasi' }
        ],
        [
          { text: '➕ Kanal qo\'shish' },
          { text: '➖ Kanal o\'chirish' }
        ],
        [
          { text: '📋 Kanallar ro\'yxati' },
          { text: '👥 Foydalanuvchilar' }
        ],
        [
          { text: '❌ Boshqaruvni yopish' }
        ]
      ],
      resize_keyboard: true
    }
  });
}
