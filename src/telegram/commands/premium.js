export async function handlePremium(ctx) {
  const user = ctx.state?.user;
  const isPremium = user?.isPremium;

  const premiumMessage = `
⭐ *Premium A'zolik va Imkoniyatlar*

Hozirgi Holatingiz: ${isPremium ? '🟢 *Faol Premium A\'zo*' : '⚪ *Oddiy Tarif*'}

🚀 *Premium Afzalliklari:*
✨ Cheksiz kunlik yuklamalar
⚡ Ustuvor (prioritet) yuklash navbati
📦 Katta hajmli fayllarni yuklash imkoniyati
🚀 Interval va kutilmalarsiz tezkor yuklash
👑 Eksklyuziv Premium belgisi

💬 *Qanday ulash mumkin?*
Administrator bilan bog'laning yoki referral havolangiz (/referral) orqali 10 ta do'stingizni taklif qiling va avtomatik 30 kunlik BEPUL Premiumga ega bo'ling!
`;

  return ctx.reply(premiumMessage, { parse_mode: 'Markdown' });
}
