import fs from 'fs';
import mongoose from 'mongoose';
import { detectPlatform } from '../utils/urlDetector.js';
import { downloadYouTube } from './extractors/youtube.js';
import { downloadInstagram } from './extractors/instagram.js';
import { downloadTikTok } from './extractors/tiktok.js';
import { downloadFacebook } from './extractors/facebook.js';
import { downloadPinterest } from './extractors/pinterest.js';
import { downloadSnapchat } from './extractors/snapchat.js';
import { downloadQueue } from './queueService.js';
import { getYtDlpBinary, execFilePromise, probeMediaInfo } from '../utils/execHelper.js';
import DownloadLog from '../models/DownloadLog.js';
import User from '../models/User.js';
import logger from '../config/logger.js';
import env from '../config/env.js';

export async function processDownload({ telegramId, url, requestedFormat = 'video' }) {
  const startTime = Date.now();
  const platform = detectPlatform(url);

  if (!platform) {
    throw new Error('Unsupported platform or invalid URL format.');
  }

  logger.info(`Processing download request for User ${telegramId} | Platform: ${platform} | URL: ${url}`);

  return downloadQueue.enqueue(async () => {
    let downloadResult = null;
    let attempts = 0;
    const maxAttempts = 2;
    let lastError = null;

    while (attempts < maxAttempts && !downloadResult) {
      attempts++;
      try {
        switch (platform) {
          case 'youtube':
            downloadResult = await downloadYouTube(url, requestedFormat);
            break;
          case 'instagram':
            downloadResult = await downloadInstagram(url);
            break;
          case 'tiktok':
            downloadResult = await downloadTikTok(url);
            break;
          case 'facebook':
            downloadResult = await downloadFacebook(url);
            break;
          case 'pinterest':
            downloadResult = await downloadPinterest(url);
            break;
          case 'snapchat':
            downloadResult = await downloadSnapchat(url);
            break;
          default:
            throw new Error(`Extractor not implemented for ${platform}`);
        }
      } catch (err) {
        lastError = err;
        logger.warn(`Download attempt ${attempts} failed for ${url}: ${err.message}`);

        const isNetworkErr = err.message.includes('ECONNRESET') || err.message.includes('ETIMEDOUT') || err.message.includes('timed out');
        if (attempts < maxAttempts && isNetworkErr) {
          await new Promise(res => setTimeout(res, 1500));
        } else {
          break;
        }
      }
    }

    const durationMs = Date.now() - startTime;

    if (!downloadResult) {
      if (mongoose.connection.readyState === 1) {
        await DownloadLog.create({
          telegramId,
          platform,
          url,
          status: 'failed',
          errorMessage: lastError ? lastError.message : 'Download failed',
          processingTimeMs: durationMs
        }).catch(err => logger.error(`Failed to log download error: ${err.message}`));
      }
      throw new Error(lastError ? lastError.message : 'Media download failed after retries.');
    }

    const maxMb = env.MAX_FILE_SIZE || 50;
    const maxBytes = maxMb * 1024 * 1024;
    if (downloadResult.fileSize > maxBytes) {
      if (fs.existsSync(downloadResult.filePath)) {
        fs.unlinkSync(downloadResult.filePath);
      }
      throw new Error(`Fayl hajmi juda katta (limit: ${maxMb}MB), pastroq sifatda urinib ko'ring.`);
    }

    if (mongoose.connection.readyState === 1) {
      await Promise.all([
        DownloadLog.create({
          telegramId,
          platform,
          url,
          mediaType: downloadResult.mediaType,
          fileSize: downloadResult.fileSize,
          status: 'success',
          processingTimeMs: durationMs
        }),
        User.findOneAndUpdate({ telegramId }, { $inc: { downloadCount: 1 }, lastActive: new Date() })
      ]).catch(err => logger.error(`Failed to record download metrics: ${err.message}`));
    }

    return {
      ...downloadResult,
      platform,
      durationMs
    };
  });
}

/**
 * Identify song from video link & search/download full original MP3 track
 */
export async function identifyAndDownloadSong(url) {
  return downloadQueue.enqueue(async () => {
    try {
      logger.info(`Extracting music metadata for URL: ${url}`);

      let songQuery = '';
      const meta = await probeMediaInfo(url);

      if (meta) {
        let rawTrack = meta.track || meta.title || '';
        let rawArtist = meta.artist || '';

        // Clean generic uploader captions like "Video by username"
        rawTrack = rawTrack.replace(/(?:Video|Photo|Reel|Post)\s+by\s+[^\s]+/i, '').trim();
        rawArtist = rawArtist.replace(/(?:Video|Photo|Reel|Post)\s+by\s+[^\s]+/i, '').trim();

        if (rawArtist && rawTrack && rawArtist.toLowerCase() !== rawTrack.toLowerCase()) {
          songQuery = `${rawArtist} - ${rawTrack}`;
        } else {
          songQuery = rawTrack || 'trending song audio';
        }
      }

      // Cleanup query strings
      songQuery = songQuery.replace(/#\w+/g, '').replace(/https?:\/\/\S+/g, '').trim();
      if (!songQuery || songQuery.length < 2) {
        songQuery = 'popular audio song';
      }

      logger.info(`Clean song query: "${songQuery}". Searching YouTube Music audio...`);

      const searchUrl = `ytsearch1:${songQuery} audio`;
      const result = await downloadYouTube(searchUrl, 'audio');

      return {
        ...result,
        songTitle: songQuery
      };
    } catch (error) {
      logger.error(`Song finder error: ${error.message}`);
      throw new Error(`Qo'shiqni aniqlashda xatolik yuz berdi: ${error.message}`);
    }
  });
}
