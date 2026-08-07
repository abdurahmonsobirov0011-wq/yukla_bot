import { execFilePromise, getYtDlpBinary } from '../utils/execHelper.js';
import path from 'path';
import fs from 'fs';
import env from '../config/env.js';
import logger from '../config/logger.js';

export async function convertVideoToAudioFormat(videoPath, targetFormat = 'mp3') {
  const timestamp = Date.now();
  const outputPath = path.join(env.DOWNLOAD_PATH, `converted_${timestamp}.${targetFormat}`);
  const binary = getYtDlpBinary();

  logger.info(`Converting video to ${targetFormat.toUpperCase()}: ${videoPath}`);

  try {
    // Convert audio format using yt-dlp / FFmpeg
    await execFilePromise(binary, [
      '--extract-audio',
      '--audio-format', targetFormat,
      '-o', outputPath,
      videoPath
    ], { timeout: 45000 });

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      return {
        filePath: outputPath,
        fileSize: stats.size,
        format: targetFormat
      };
    }
  } catch (err) {
    logger.error(`Audio conversion failed: ${err.message}`);
  }

  throw new Error(`Audio ${targetFormat.toUpperCase()} konvertatsiyasida xatolik yuz berdi.`);
}
