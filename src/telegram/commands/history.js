import mongoose from 'mongoose';
import DownloadLog from '../../models/DownloadLog.js';

export async function handleHistory(ctx) {
  const telegramId = ctx.from?.id;

  if (mongoose.connection.readyState !== 1) {
    return ctx.reply('📑 *Yuklamalar Tarixi*\n\nHali yuklamalar tarixi yo\'q.', { parse_mode: 'Markdown' });
  }

  const logs = await DownloadLog.find({ telegramId, status: 'success' })
    .sort({ createdAt: -1 })
    .limit(5);

  if (!logs.length) {
    return ctx.reply('📑 *Yuklamalar Tarixi*\n\nHali birorta ham media yuklamagansiz.', { parse_mode: 'Markdown' });
  }

  let historyText = '📑 *So\'nggi 5 Ta Yuklamangiz Tarixi:*\n\n';
  logs.forEach((log, idx) => {
    historyText += `${idx + 1}. *${log.platform.toUpperCase()}* - ${new Date(log.createdAt).toLocaleDateString()}\n🔗 \`${log.url.slice(0, 35)}...\`\n\n`;
  });

  return ctx.reply(historyText, { parse_mode: 'Markdown' });
}
