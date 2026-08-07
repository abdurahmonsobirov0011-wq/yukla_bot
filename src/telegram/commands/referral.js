import env from '../../config/env.js';
import { getReferralLeaderboard } from '../../services/statsService.js';

export async function handleReferral(ctx) {
  const user = ctx.state?.user;
  if (!user) return;

  const botUsername = ctx.botInfo?.username || env.BOT_USERNAME || 'MediaDownloaderBot';
  const refLink = `https://t.me/${botUsername}?start=ref_${user.referralCode}`;

  const topReferrers = await getReferralLeaderboard(5);
  let leaderboardText = '';
  topReferrers.forEach((topUser, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤';
    const name = `${topUser.firstName || ''} ${topUser.lastName || ''}`.trim() || topUser.username || 'Foydalanuvchi';
    leaderboardText += `${medal} ${name}: *${topUser.referralCount}* ta taklif\n`;
  });

  const referralMessage = `
🎁 *Referral Tizimi va Mukofotlar*

Do'stlaringizni taklif qiling va Premium imkoniyatlarni bepul qo'lga kiriting!

🔗 *Sizning Maxsus Taklif Havolangiz:*
\`${refLink}\`

📊 *Sizning Ko'rsatkichlaringiz:*
• Taklif Qilingan Do'stlar: *${user.referralCount} ta*
• Sizning Referral Kodingiz: \`${user.referralCode}\`

🏆 *Eng Ko'p Taklif Qilganlar Peshqadamboshi:*
${leaderboardText || 'Hali takliflar yo\'q. Birinchi bo\'ling!'}

🎉 *Mukofot:* 10 ta do'stingizni taklif qiling va 1 oylik BEPUL Premiumga ega bo'ling!
`;

  return ctx.reply(referralMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '📢 Havolani Do\'stlarga Ulashish',
            url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Instagram, YouTube, TikTok va boshqa tarmoqlardan videolarni bepul va suv belgisiz yuklovchi bot!')}`
          }
        ]
      ]
    }
  });
}
