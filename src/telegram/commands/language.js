export async function handleLanguage(ctx) {
  const message = `
🌐 *Tilni Tanlang / Select Language / Выберите язык*

• 🇺🇿 *O'zbek tili* (Faol)
• 🇬🇧 *English*
• 🇷🇺 *Русский*

Tilni o'zgartirish uchun kerakli tugmani bosing:
`;

  return ctx.reply(message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🇺🇿 O'zbekcha", callback_data: 'lang_uz' },
          { text: '🇬🇧 English', callback_data: 'lang_en' },
          { text: '🇷🇺 Русский', callback_data: 'lang_ru' }
        ]
      ]
    }
  });
}
