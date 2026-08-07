import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const env = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  MONGODB_URI: process.env.MONGODB_URI || '',
  REDIS_URI: process.env.REDIS_URI || '',
  ADMIN_IDS: (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()).filter(Boolean).map(Number),
  FORCED_CHANNELS: (process.env.FORCED_CHANNELS || '').split(',').map(ch => ch.trim()).filter(Boolean),
  PORT: parseInt(process.env.PORT || '3000', 10),
  DOWNLOAD_PATH: path.resolve(process.env.DOWNLOAD_PATH || './downloads'),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '50', 10),
  JWT_SECRET: process.env.JWT_SECRET || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  BOT_USERNAME: process.env.BOT_USERNAME || 'MediaDownloaderBot',
  AUDD_API_KEY: process.env.AUDD_API_KEY || 'test',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Ensure download directory exists
if (!fs.existsSync(env.DOWNLOAD_PATH)) {
  fs.mkdirSync(env.DOWNLOAD_PATH, { recursive: true });
}

export function validateEnv() {
  if (!env.BOT_TOKEN) {
    console.warn('⚠️ WARNING: BOT_TOKEN is missing! Please set BOT_TOKEN in Railway Variables.');
  }

  if (!env.MONGODB_URI) {
    console.warn('⚠️ MONGODB_URI is not set. Running with localStore JSON database fallback.');
  }

  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32) {
    env.JWT_SECRET = process.env.JWT_SECRET || 'default_super_secret_jwt_key_32chars_fallback';
  }
}


export default env;
