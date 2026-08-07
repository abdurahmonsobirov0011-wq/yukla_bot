import mongoose from 'mongoose';
import env from '../config/env.js';
import BotSettings from '../models/BotSettings.js';
import logger from '../config/logger.js';

const defaultSettings = {
  key: 'main',
  forcedChannels: env.FORCED_CHANNELS,
  subscriptionRequired: env.FORCED_CHANNELS.length > 0,
  maintenanceMode: false,
  maintenanceMessage: 'Botda texnik ishlar olib borilmoqda. Iltimos, keyinroq urinib ko‘ring.'
};

let memorySettings = { ...defaultSettings };

export async function getBotSettings() {
  if (mongoose.connection.readyState !== 1) {
    return memorySettings;
  }

  try {
    const settings = await BotSettings.findOneAndUpdate(
      { key: 'main' },
      { $setOnInsert: defaultSettings },
      { upsert: true, new: true }
    ).lean();

    memorySettings = {
      ...defaultSettings,
      ...settings,
      forcedChannels: settings.forcedChannels || []
    };
    return memorySettings;
  } catch (error) {
    logger.error(`Failed to load bot settings: ${error.message}`);
    return memorySettings;
  }
}

export async function updateBotSettings(payload) {
  const nextSettings = {
    forcedChannels: Array.isArray(payload.forcedChannels)
      ? payload.forcedChannels.map(ch => ch.trim()).filter(Boolean)
      : memorySettings.forcedChannels,
    subscriptionRequired: Boolean(payload.subscriptionRequired),
    maintenanceMode: Boolean(payload.maintenanceMode),
    maintenanceMessage: payload.maintenanceMessage?.trim() || defaultSettings.maintenanceMessage
  };

  memorySettings = { ...memorySettings, ...nextSettings };

  if (mongoose.connection.readyState !== 1) {
    return memorySettings;
  }

  const settings = await BotSettings.findOneAndUpdate(
    { key: 'main' },
    { $set: nextSettings },
    { upsert: true, new: true }
  ).lean();

  memorySettings = { ...defaultSettings, ...settings };
  return memorySettings;
}

