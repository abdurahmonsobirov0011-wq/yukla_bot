export async function handleHelp(ctx) {
  const helpMessage = `
📖 *Yordam va Botdan Foydalanish Qo'llanmasi*

*Qo'llab-quvvatlanadigan platformalar:*
1. *Instagram*: Reels, Post, IGTV yoki ochiq Stories havolasini yuboring.
2. *YouTube*: Video yoki Shorts havolasini yuboring.
3. *TikTok*: Suv belgisiz (no watermark) video yuklash uchun linkni yuboring.
4. *Facebook*: Reels yoki Video havolasini yuboring.
5. *Pinterest*: Rasm yoki Video pin havolasini yuboring.
6. *Snapchat*: Ochiq story yoki spotlight havolasini yuboring.

⚡ *Maslahatlar:*
• Kontent yoki sahifa *Ochiq (Public)* bo'lishi kerak. Yopiq (Private) profillardagi fayllarni yuklab bo'lmaydi.
• Link yuborishingiz bilan bot uni avtomatik aniqlab, yuklab beradi.
`;

  return ctx.reply(helpMessage, { parse_mode: 'Markdown' });
}
