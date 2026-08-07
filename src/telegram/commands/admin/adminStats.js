import mongoose from 'mongoose';
import User from '../../../models/User.js';
import env from '../../../config/env.js';
import logger from '../../../config/logger.js';
import { isOwner } from '../../middlewares/adminMiddleware.js';

export async function handleAdminStats(ctx) {
  if (!isOwner(ctx)) return ctx.reply("❌ Sizda ruxsat yo'q.");

  const uptimeStr = formatUptime(process.uptime());

  if (mongoose.connection.readyState !== 1) {
    return ctx.reply(`📊 Tizim ma'lumotlari:\nUptime: ${uptimeStr}\n❌ Ma'lumotlar bazasi ulanmagan.`);
  }

  try {
    const totalUsers = await User.countDocuments();
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    
    const todayUsers = await User.countDocuments({ updatedAt: { $gte: startOfToday } });
    
    let totalDownloads = 'N/A';
    let successfulDownloads = 'N/A';
    try {
      const DownloadLog = mongoose.model('DownloadLog');
      if (DownloadLog) {
        totalDownloads = await DownloadLog.countDocuments();
        successfulDownloads = await DownloadLog.countDocuments({ status: 'success' });
      }
    } catch(e) {}

    const msg = `📊 Bot statistikasi:\n\n` +
      `👥 Foydalanuvchilar:\n` +
      `Umumiy: ${totalUsers}\n` +
      `Bugun: ${todayUsers}\n\n` +
      `📥 Yuklamalar:\n` +
      `Umumiy: ${totalDownloads}\n` +
      `Muvaffaqiyatli: ${successfulDownloads}\n\n` +
      `⏱ Uptime: ${uptimeStr}`;
      
    return ctx.reply(msg);
  } catch (error) {
    logger.error(`Stats error: ${error.message}`);
    return ctx.reply("❌ Xatolik yuz berdi.");
  }
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600*24));
  const h = Math.floor(seconds % (3600*24) / 3600);
  const m = Math.floor(seconds % 3600 / 60);
  const s = Math.floor(seconds % 60);
  return `${d}k ${h}s ${m}d ${s}s`;
}
