import { execFilePromise, getYtDlpBinary } from '../utils/execHelper.js';
import path from 'path';
import fs from 'fs';
import env from '../config/env.js';
import logger from '../config/logger.js';

export async function createGifFromVideo(videoPath) {
  const timestamp = Date.now();
  const outputPath = path.join(env.DOWNLOAD_PATH, `gif_${timestamp}.gif`);
  const binary = getYtDlpBinary();

  logger.info(`Generating GIF from video: ${videoPath}`);

  try {
    await execFilePromise(binary, [
      '--recode-video', 'gif',
      '-o', outputPath,
      videoPath
    ], { timeout: 45000 });

    if (fs.existsSync(outputPath)) {
      const stats = fs.statSync(outputPath);
      return {
        filePath: outputPath,
        fileSize: stats.size
      };
    }
  } catch (err) {
    logger.error(`GIF generation failed: ${err.message}`);
  }

  throw new Error('GIF yaratishda xatolik yuz berdi.');
}
