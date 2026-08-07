import mongoose from 'mongoose';
import env from '../../../config/env.js';
import logger from '../../../config/logger.js';
import User from '../../../models/User.js';
import { isOwner } from '../../middlewares/adminMiddleware.js';
import { activeUsersMemorySet } from '../../middlewares/userMiddleware.js';

export async function handleBroadcast(ctx) {
  if (!isOwner(ctx)) return ctx.reply("❌ Sizda ruxsat yo'q.");
  
  if (!ctx.session) ctx.session = {};
  if (!ctx.state) ctx.state = {};
  ctx.state.awaitingBroadcast = true;
  ctx.session.awaitingBroadcast = true;
  
  return ctx.reply("📢 *Tarqatmoqchi bo'lgan xabarni yuboring*\n\nMatn, rasm, video, audio, ovozli xabar, dokument yoki stiker yuborishingiz mumkin:", { parse_mode: 'Markdown' });
}

export async function handleBroadcastMessage(ctx) {
  if (!isOwner(ctx)) return ctx.reply("❌ Sizda ruxsat yo'q.");
  
  try {
    let targetUserIds = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const users = await User.find({ isBanned: false }).select('telegramId');
        targetUserIds = users.map(u => u.telegramId);
      } catch (err) {
        logger.warn(`Failed to fetch broadcast users from DB: ${err.message}`);
      }
    }

    if (targetUserIds.length === 0) {
      targetUserIds = Array.from(activeUsersMemorySet);
    }

    if (targetUserIds.length === 0) {
      targetUserIds = [ctx.from.id];
    }

    const statusMsg = await ctx.reply(`📡 *Tarqatish boshlandi...*\nJami maqsadli foydalanuvchilar: *${targetUserIds.length} ta*`, { parse_mode: 'Markdown' });
    
    let successCount = 0;
    let failCount = 0;
    const totalUsers = targetUserIds.length;
    const startTime = Date.now();
    
    for (let i = 0; i < totalUsers; i++) {
      const targetId = targetUserIds[i];
      try {
        await ctx.telegram.copyMessage(targetId, ctx.chat.id, ctx.message.message_id);
        successCount++;
      } catch (err) {
        failCount++;
      }
      
      if ((i + 1) % 20 === 0 || i === totalUsers - 1) {
        try {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            statusMsg.message_id,
            undefined,
            `📡 *Tarqatish jarayoni:*\n\nBarchasi: *${totalUsers}*\nYetkazildi: *${successCount}*\nXatoliklar: *${failCount}*`,
            { parse_mode: 'Markdown' }
          );
        } catch (e) {
          // ignore edit throttling errors
        }
      }
      
      await new Promise(r => setTimeout(r, 35));
    }
    
    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
    if (ctx.session) ctx.session.awaitingBroadcast = false;
    if (ctx.state) ctx.state.awaitingBroadcast = false;
    
    await ctx.reply(`✅ *Tarqatish yakunlandi!*\n\n📊 *Natijalar:*\nUmumiy: *${totalUsers} ta*\nYetkazildi: *${successCount} ta*\nXatoliklar: *${failCount} ta*\nSarflangan vaqt: *${timeTaken} soniya*`, { parse_mode: 'Markdown' });
  } catch (error) {
    logger.error(`Broadcast error: ${error.message}`);
    ctx.reply(`❌ Xatolik yuz berdi: ${error.message}`);
  }
}
