import { Telegraf } from 'telegraf';
import env from '../config/env.js';
import logger from '../config/logger.js';

// User middlewares
import { userMiddleware } from './middlewares/userMiddleware.js';
import { rateLimitMiddleware } from './middlewares/rateLimitMiddleware.js';
import { blacklistMiddleware } from './middlewares/blacklistMiddleware.js';
import { forceJoinCheck } from './middlewares/forceJoinMiddleware.js';

// User commands
import { handleStart } from './commands/start.js';
import { handleHelp } from './commands/help.js';
import { handleAbout } from './commands/about.js';
import { handleStats } from './commands/stats.js';
import { handlePremium } from './commands/premium.js';
import { handleReferral } from './commands/referral.js';
import { handleSettings } from './commands/settings.js';
import { handleProfile } from './commands/profile.js';
import { handleHistory } from './commands/history.js';
import { handleFavorites } from './commands/favorites.js';
import { handleLanguage } from './commands/language.js';

// Admin commands
import { handleAdmin } from './commands/admin.js';
import { handleAdminStats } from './commands/admin/adminStats.js';
import { handleBroadcast, handleBroadcastMessage } from './commands/admin/broadcast.js';
import { handleChannel } from './commands/admin/channel.js';
import { handleUsers, handleBan, handleUnban } from './commands/admin/users.js';
import { isOwner } from './middlewares/adminMiddleware.js';

// Handlers
import { handleUrlMessage } from './handlers/urlHandler.js';
import { handleCallbackQuery } from './handlers/callbackHandler.js';
import { handleAudioOrVoice } from './handlers/audioHandler.js';

// State trackers for interactive admin flows
const broadcastWaiting = new Set();
const addChannelWaiting = new Set();
const removeChannelWaiting = new Set();

export function createBot() {
  if (!env.BOT_TOKEN) {
    logger.warn('BOT_TOKEN mavjud emas. Bot ishga tushmaydi.');
    return null;
  }

  const bot = new Telegraf(env.BOT_TOKEN);

  // Set Bot Description
  bot.telegram.setMyDescription(`Sizga eng so'ngi xitlarni va qo'shiqlarni topib beradi 🔥

• Instagram - post, stories, reels
• YouTube - video, shorts, audio
• TikTok - suv belgisiz video
• Facebook - reels, rasm
• Pinterest - rasm, video
• Snapchat - rasm, video
🎵 Musiqa Qidiruv - Qo'shiq nomini yoki matnini yuboring!
🎧 Shazam - Ovozli xabar yuborib musiqani toping!`).catch(() => {});

  bot.telegram.setMyShortDescription("Instagram, YouTube, TikTok, Shazam va AI bilan ishlovchi yuklovchi bot 🔥").catch(() => {});

  bot.telegram.setMyCommands([
    { command: 'start', description: 'Botni ishga tushirish' },
    { command: 'admin', description: 'Admin boshqaruv paneli' },
    { command: 'help', description: 'Yordam' },
    { command: 'profile', description: 'Profilingiz' },
    { command: 'history', description: 'Yuklamalar tarixi' },
    { command: 'favorites', description: 'Tanlanganlar' },
    { command: 'stats', description: 'Statistika' },
    { command: 'referral', description: 'Do\'stlarni taklif qilish' },
    { command: 'premium', description: 'Premium obuna' },
    { command: 'language', description: 'Tilni o\'zgartirish' },
    { command: 'about', description: 'Bot haqida' }
  ]).catch(() => {});

  // --- MIDDLEWARES ---
  bot.use(userMiddleware);
  bot.use(blacklistMiddleware);
  bot.use(rateLimitMiddleware);
  bot.use(forceJoinCheck);

  // --- ADMIN COMMANDS ---
  bot.command('admin', handleAdmin);

  bot.command('broadcast', (ctx) => {
    if (!isOwner(ctx)) return ctx.reply('❌ Sizda ruxsat yo\'q.');
    broadcastWaiting.add(ctx.from.id);
    return handleBroadcast(ctx);
  });

  bot.command('adminstats', handleAdminStats);
  bot.command('channel', handleChannel);
  bot.command('users', handleUsers);
  bot.command('ban', handleBan);
  bot.command('unban', handleUnban);

  // --- USER COMMANDS ---
  bot.command('start', (ctx) => {
    // If admin runs start, show start message + admin menu option
    if (isOwner(ctx)) {
      handleStart(ctx);
      return handleAdmin(ctx);
    }
    return handleStart(ctx);
  });

  bot.command('help', handleHelp);
  bot.command('about', handleAbout);
  bot.command('stats', handleStats);
  bot.command('premium', handlePremium);
  bot.command('referral', handleReferral);
  bot.command('settings', handleSettings);
  bot.command('profile', handleProfile);
  bot.command('history', handleHistory);
  bot.command('favorites', handleFavorites);
  bot.command('language', handleLanguage);

  // --- HANDLERS ---
  bot.on('callback_query', handleCallbackQuery);
  bot.on('voice', handleAudioOrVoice);
  bot.on('audio', handleAudioOrVoice);

  // Text handler with Admin Reply Keyboard actions & state checks
  bot.on('text', (ctx) => {
    const text = ctx.message.text.trim();

    if (isOwner(ctx)) {
      // 1. Admin Keyboard Button Actions
      if (text === '📢 Reklama / Yangilik tarqatish') {
        broadcastWaiting.add(ctx.from.id);
        return handleBroadcast(ctx);
      }

      if (text === '📊 Bot statistikasi') {
        return handleAdminStats(ctx);
      }

      if (text === '➕ Kanal qo\'shish') {
        addChannelWaiting.add(ctx.from.id);
        return ctx.reply('✍️ Qo\'shmoqchi bo\'lgan majburiy kanal foydalanuvchi nomini yuboring (masalan: `@mychannel`):', { parse_mode: 'Markdown' });
      }

      if (text === '➖ Kanal o\'chirish') {
        removeChannelWaiting.add(ctx.from.id);
        return ctx.reply('✍️ O\'chirmoqchi bo\'lgan kanal foydalanuvchi nomini yuboring (masalan: `@mychannel`):', { parse_mode: 'Markdown' });
      }

      if (text === '📋 Kanallar ro\'yxati') {
        ctx.message.text = '/channel list';
        return handleChannel(ctx);
      }

      if (text === '👥 Foydalanuvchilar') {
        return handleUsers(ctx);
      }

      if (text === '❌ Boshqaruvni yopish') {
        broadcastWaiting.delete(ctx.from.id);
        addChannelWaiting.delete(ctx.from.id);
        removeChannelWaiting.delete(ctx.from.id);
        return ctx.reply('👑 Admin boshqaruv paneli yopildi.', { reply_markup: { remove_keyboard: true } });
      }

      // 2. Interactive Admin Input Flows
      if (addChannelWaiting.has(ctx.from.id)) {
        addChannelWaiting.delete(ctx.from.id);
        ctx.message.text = `/channel add ${text}`;
        return handleChannel(ctx);
      }

      if (removeChannelWaiting.has(ctx.from.id)) {
        removeChannelWaiting.delete(ctx.from.id);
        ctx.message.text = `/channel remove ${text}`;
        return handleChannel(ctx);
      }

      if (broadcastWaiting.has(ctx.from.id)) {
        broadcastWaiting.delete(ctx.from.id);
        return handleBroadcastMessage(ctx);
      }
    }

    return handleUrlMessage(ctx);
  });

  // Photo/Video/Document/Sticker for broadcast
  bot.on(['photo', 'video', 'document', 'sticker', 'animation'], (ctx) => {
    if (broadcastWaiting.has(ctx.from.id) && isOwner(ctx)) {
      broadcastWaiting.delete(ctx.from.id);
      return handleBroadcastMessage(ctx);
    }
  });

  bot.catch((err, ctx) => {
    logger.error(`Telegram Bot error: ${err.message}`, { error: err });
  });

  return bot;
}
