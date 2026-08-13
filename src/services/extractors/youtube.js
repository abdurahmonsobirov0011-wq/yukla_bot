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
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '--extractor-args', `youtube:player_client=${client}`,
      '--referer', 'https://www.youtube.com/'
    ];

    if (ffmpegBin) {
      args.push('--ffmpeg-location', ffmpegBin);
    }

    if (format === 'audio') {
      if (hasFfmpeg) {
        args.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '0', '-o', outputPath, url);
      } else {
        args.push('-f', 'ba/best[ext=m4a]/best', '-o', outputPath, url);
      }
    } else {
      args.push('-f', 'bv*[ext=mp4]+ba[ext=m4a]/b[ext=mp4]/best', '-o', outputPath, url);
    }

    logger.info(`Executing YouTube download via execFile (client=${client}): ${url}`);

    try {
      await execFilePromise(binary, args, { timeout: 180000 });

      const files = fs.readdirSync(env.DOWNLOAD_PATH);
      const downloadedFile = files.find(f => f.startsWith(`yt_${timestamp}`));

      if (!downloadedFile) {
        throw new Error(`Downloaded file not found for YouTube URL: ${url}`);
      }

      const fullFilePath = path.join(env.DOWNLOAD_PATH, downloadedFile);
      const stats = fs.statSync(fullFilePath);

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
      if (error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('unable to download')) {
        continue;
      }
      break;
    }
  }

  logger.error(`YouTube download final error: ${lastError?.message}`);
  throw new Error(`Failed to download YouTube media: ${lastError?.message}`);
}


