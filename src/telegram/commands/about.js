export async function handleAbout(ctx) {
  const aboutMessage = `
🤖 *Media Downloader Bot Haqida*

*Versiya:* 1.0.0 (Ishonchli va Tezkor)
*Dasturlash tili:* Node.js, Express, Telegraf & yt-dlp
*Baza:* MongoDB Cluster

🌟 *Asosiy imkoniyatlar:*
• Havolalarni lahzalik aniqlash
• TikTok videolarini suv belgisiz yuklash
• YouTube videolarni MP4 va MP3 qilib olish
• Avtomatik vaqtinchalik fayllarni o'chirish va xavfsizlik
• Yuqori tezlikdagi server infratuzilmasi

🛡️ *Maxfiylik kafolati:*
Yuklangan media fayllar serverda saqlanmaydi va foydalanuvchiga yuborilishi bilan darhol o'chiriladi.
`;

  return ctx.reply(aboutMessage, { parse_mode: 'Markdown' });
}
