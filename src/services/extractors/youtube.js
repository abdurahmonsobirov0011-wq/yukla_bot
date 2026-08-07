import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getYtDlpBinary, execFilePromise, probeMediaInfo } from '../../utils/execHelper.js';

let isFfmpegAvailableCache = null;
function isFfmpegAvailable() {
  if (isFfmpegAvailableCache !== null) return isFfmpegAvailableCache;
  try {
    execSync('ffmpeg -version', { encoding: 'utf8', timeout: 3000 });
    isFfmpegAvailableCache = true;
  } catch (err) {
    isFfmpegAvailableCache = false;
  }
  return isFfmpegAvailableCache;
}

export async function downloadYouTube(url, format = 'video') {
  const timestamp = Date.now();
  const binary = getYtDlpBinary();
  const maxMb = env.MAX_FILE_SIZE || 50;

  // Pre-download Json Size Probing (< 2s)
  const meta = await probeMediaInfo(url);
  if (meta && meta.filesizeMb > maxMb) {
    throw new Error(`Fayl hajmi juda katta (${meta.filesizeMb.toFixed(1)}MB, limit: ${maxMb}MB), pastroq sifatda urinib ko'ring.`);
  }

  const outputFileName = `yt_${timestamp}_%(id)s.${format === 'audio' ? (isFfmpegAvailable() ? 'mp3' : 'm4a') : 'mp4'}`;
  const outputPath = path.join(env.DOWNLOAD_PATH, outputFileName);

  // User-Agent and player client headers to prevent 403 Forbidden errors on YouTube
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--max-filesize', `${maxMb}M`,
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    '--extractor-args', 'youtube:player_client=android,web'
  ];

  if (format === 'audio') {
    if (isFfmpegAvailable()) {
      args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outputPath, url);
    } else {
      args.push('-f', 'ba/best[ext=m4a]/best', '-o', outputPath, url);
    }
  } else {
    args.push('-f', `b[filesize<${maxMb}M]/best[filesize<${maxMb}M]/best[ext=mp4]/best`, '-o', outputPath, url);
  }

  logger.info(`Executing YouTube download via execFile (Header Bypasses Active): ${url}`);

  try {
    await execFilePromise(binary, args, { timeout: 60000 });

    const files = fs.readdirSync(env.DOWNLOAD_PATH);
    const downloadedFile = files.find(f => f.startsWith(`yt_${timestamp}`));

    if (!downloadedFile) {
      throw new Error(`Downloaded file not found for YouTube URL: ${url}`);
    }

    const fullFilePath = path.join(env.DOWNLOAD_PATH, downloadedFile);
    const stats = fs.statSync(fullFilePath);

    const maxBytes = maxMb * 1024 * 1024;
    if (stats.size > maxBytes) {
      fs.unlinkSync(fullFilePath);
      throw new Error(`Fayl hajmi juda katta (limit: ${maxMb}MB), pastroq sifatda urinib ko'ring.`);
    }

    return {
      filePath: fullFilePath,
      fileName: downloadedFile,
      fileSize: stats.size,
      mediaType: format === 'audio' ? 'audio' : 'video',
      title: meta?.title || 'YouTube Media'
    };
  } catch (error) {
    logger.error(`YouTube download error: ${error.message}`);
    throw new Error(error.message.includes('juda katta') ? error.message : `Failed to download YouTube media: ${error.message}`);
  }
}
