import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getYtDlpBinary, getFfmpegBinary, execFilePromise, probeMediaInfo } from '../../utils/execHelper.js';

function isFfmpegAvailable() {
  try {
    const bin = getFfmpegBinary();
    execSync(`"${bin}" -version`, { encoding: 'utf8', timeout: 3000 });
    return true;
  } catch (err) {
    return false;
  }
}

export async function downloadYouTube(url, format = 'video') {
  const timestamp = Date.now();
  const binary = getYtDlpBinary();
  const ffmpegBin = getFfmpegBinary();
  const hasFfmpeg = isFfmpegAvailable();
  const maxMb = env.MAX_FILE_SIZE || 50;
  const targetMb = maxMb - 1; // 49MB threshold for Telegram safety

  const meta = await probeMediaInfo(url);
  const outputFileName = `yt_${timestamp}_%(id)s.${format === 'audio' ? (hasFfmpeg ? 'mp3' : 'm4a') : 'mp4'}`;
  const outputPath = path.join(env.DOWNLOAD_PATH, outputFileName);

  const playerClients = [
    'android,web',
    'ios,web',
    'web_creator,android',
    'mweb'
  ];

  let lastError = null;

  for (const client of playerClients) {
    const args = [
      '--no-playlist',
      '--no-warnings',
      '--max-filesize', `${targetMb}M`,
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '--extractor-args', `youtube:player_client=${client}`,
      '--referer', 'https://www.youtube.com/'
    ];

    if (ffmpegBin) {
      args.push('--ffmpeg-location', ffmpegBin);
    }

    if (format === 'audio') {
      if (hasFfmpeg) {
        args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '5', '-o', outputPath, url);
      } else {
        args.push('-f', `ba[filesize<${targetMb}M]/best[ext=m4a][filesize<${targetMb}M]/best[filesize<${targetMb}M]`, '-o', outputPath, url);
      }
    } else {
      // If meta indicates a large file, prioritize compressed / lower resolutions (720p, 480p, 360p) so it fits 49MB
      if (meta && meta.filesizeMb > targetMb) {
        args.push('-f', `bestvideo[height<=720][filesize<${targetMb}M]+bestaudio/bestvideo[height<=480][filesize<${targetMb}M]+bestaudio/b[filesize<${targetMb}M]/worst[filesize<${targetMb}M]`, '-o', outputPath, url);
      } else {
        args.push('-f', `b[filesize<${targetMb}M]/bestvideo[filesize<${targetMb}M]+bestaudio/best[filesize<${targetMb}M]/best`, '-o', outputPath, url);
      }
    }

    logger.info(`Executing YouTube download via execFile (client=${client}): ${url}`);

    try {
      await execFilePromise(binary, args, { timeout: 90000 });

      const files = fs.readdirSync(env.DOWNLOAD_PATH);
      const downloadedFile = files.find(f => f.startsWith(`yt_${timestamp}`));

      if (!downloadedFile) {
        throw new Error(`Downloaded file not found for YouTube URL: ${url}`);
      }

      const fullFilePath = path.join(env.DOWNLOAD_PATH, downloadedFile);
      const stats = fs.statSync(fullFilePath);

      const maxBytes = targetMb * 1024 * 1024;
      if (stats.size > maxBytes) {
        fs.unlinkSync(fullFilePath);
        throw new Error(`Fayl hajmi Telegram limitidan oshadi (max: ${targetMb}MB).`);
      }

      return {
        filePath: fullFilePath,
        fileName: downloadedFile,
        fileSize: stats.size,
        mediaType: format === 'audio' ? 'audio' : 'video',
        title: meta?.title || 'YouTube Media'
      };
    } catch (error) {
      lastError = error;
      logger.warn(`YouTube download attempt failed with player_client=${client}: ${error.message}`);
      // Retry next client if HTTP 403 or extractor error
      if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('unable to download')) {
        continue;
      }
      break;
    }
  }

  logger.error(`YouTube download final error: ${lastError?.message}`);
  throw new Error(lastError?.message.includes('Telegram limitidan') ? lastError.message : `Failed to download YouTube media: ${lastError?.message}`);
}

