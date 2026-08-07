import mongoose from 'mongoose';
import MediaCache from '../models/MediaCache.js';
import logger from '../config/logger.js';

// In-memory fast LRU cache map for instant lookups
const memoryCache = new Map();
const MAX_MEMORY_ITEMS = 500;

function cleanUrl(url) {
  if (!url) return '';
  return url.split('?')[0].trim();
}

export async function getCachedMedia(rawUrl) {
  const url = cleanUrl(rawUrl);
  if (!url) return null;

  // 1. Check in-memory LRU cache (<1ms response)
  if (memoryCache.has(url)) {
    logger.info(`⚡ Cache HIT (In-Memory) for URL: ${url}`);
    return memoryCache.get(url);
  }

  // 2. Check MongoDB persistent cache
  if (mongoose.connection.readyState === 1) {
    try {
      const cached = await MediaCache.findOne({ url });
      if (cached) {
        logger.info(`⚡ Cache HIT (Database) for URL: ${url}`);
        const result = {
          fileId: cached.fileId,
          mediaType: cached.mediaType,
          title: cached.title,
          platform: cached.platform
        };
        // Populate in-memory cache
        setMemoryCache(url, result);
        return result;
      }
    } catch (err) {
      logger.error(`MediaCache lookup error: ${err.message}`);
    }
  }

  return null;
}

export async function setCachedMedia(rawUrl, data) {
  const url = cleanUrl(rawUrl);
  if (!url || !data.fileId) return;

  // Populate memory cache
  setMemoryCache(url, data);

  // Populate MongoDB persistent cache
  if (mongoose.connection.readyState === 1) {
    try {
      await MediaCache.updateOne(
        { url },
        {
          url,
          platform: data.platform || 'unknown',
          mediaType: data.mediaType || 'video',
          fileId: data.fileId,
          title: data.title || ''
        },
        { upsert: true }
      );
      logger.info(`💾 Cached Telegram file_id for URL: ${url}`);
    } catch (err) {
      logger.error(`Failed to save MediaCache: ${err.message}`);
    }
  }
}

function setMemoryCache(key, value) {
  if (memoryCache.size >= MAX_MEMORY_ITEMS) {
    const firstKey = memoryCache.keys().next().value;
    memoryCache.delete(firstKey);
  }
  memoryCache.set(key, value);
}
