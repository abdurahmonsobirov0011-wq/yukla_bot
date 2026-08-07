export async function handleSettings(ctx) {
  const message = `
⚙️ *Bot Sozlamalari*

Ushbu bo'limda bot sozlamalarini va afzalliklaringizni o'zgartirishingiz mumkin:

• *Til (Language):* O'zbek tili 🇺🇿
• *Sifat (Quality):* Yuqori HD
• *Avto-Kesh:* Yoqilgan ⚡
• *Xabarnomalar:* Yoqilgan 🔔

Tilni o'zgartirish uchun /language buyrug'idan foydalaning.
`;

  return ctx.reply(message, { parse_mode: 'Markdown' });
}
