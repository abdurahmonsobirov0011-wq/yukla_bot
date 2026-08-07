import mongoose from 'mongoose';
import User from '../../../models/User.js';
import env from '../../../config/env.js';
import logger from '../../../config/logger.js';
import { isOwner } from '../../middlewares/adminMiddleware.js';

export async function handleUsers(ctx) {
  if (!isOwner(ctx)) return ctx.reply("❌ Sizda ruxsat yo'q.");
  
  if (mongoose.connection.readyState !== 1) {
    return ctx.reply("❌ DB xatosi.");
  }

  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(10);
    if (!users || users.length === 0) {
      return ctx.reply("Foydalanuvchilar topilmadi.");
    }

    let msg = "👥 Oxirgi 10 foydalanuvchi:\n\n";
    users.forEach((u, i) => {
      const name = u.name || u.firstName || 'User';
      const dlCount = u.downloadCount || 0;
      msg += `${i + 1}. ${name} (ID: ${u.telegramId}) - Yuklamalar: ${dlCount}\n`;
    });
    
    return ctx.reply(msg);
  } catch (error) {
    logger.error(`Users command error: ${error.message}`);
    return ctx.reply("❌ Xatolik.");
  }
}

export async function handleBan(ctx) {
  if (!isOwner(ctx)) return ctx.reply("❌ Sizda ruxsat yo'q.");
  
  const parts = ctx.message.text.split(' ');
  const targetId = parts[1];
  
  if (!targetId) return ctx.reply("ID kiriting: /ban 123456");

  try {
    const user = await User.findOne({ telegramId: targetId });
    if (!user) return ctx.reply("❌ Foydalanuvchi topilmadi.");
    
    user.isBanned = true;
    await user.save();
    
    try {
      const Blacklist = mongoose.model('Blacklist');
      if (Blacklist) {
        await Blacklist.findOneAndUpdate({ telegramId: targetId }, { telegramId: targetId, reason: 'Banned by admin' }, { upsert: true });
      }
    } catch(e) {}
    
    return ctx.reply(`✅ Foydalanuvchi ${targetId} bloklandi.`);
  } catch (error) {
    logger.error(`Ban error: ${error.message}`);
    return ctx.reply("❌ Xatolik.");
  }
}

export async function handleUnban(ctx) {
  if (!isOwner(ctx)) return ctx.reply("❌ Sizda ruxsat yo'q.");
  
  const parts = ctx.message.text.split(' ');
  const targetId = parts[1];
  
  if (!targetId) return ctx.reply("ID kiriting: /unban 123456");

  try {
    const user = await User.findOne({ telegramId: targetId });
    if (!user) return ctx.reply("❌ Foydalanuvchi topilmadi.");
    
    user.isBanned = false;
    await user.save();
    
    try {
      const Blacklist = mongoose.model('Blacklist');
      if (Blacklist) {
        await Blacklist.findOneAndDelete({ telegramId: targetId });
      }
    } catch(e) {}
    
    return ctx.reply(`✅ Foydalanuvchi ${targetId} blokdan chiqarildi.`);
  } catch (error) {
    logger.error(`Unban error: ${error.message}`);
    return ctx.reply("❌ Xatolik.");
  }
}
