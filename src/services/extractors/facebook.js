import path from 'path';
import fs from 'fs';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getYtDlpBinary, execFilePromise } from '../../utils/execHelper.js';

export async function downloadFacebook(url) {
  const timestamp = Date.now();
  const outputPath = path.join(env.DOWNLOAD_PATH, `fb_${timestamp}_%(id)s.%(ext)s`);
  const binary = getYtDlpBinary();
  const maxMb = env.MAX_FILE_SIZE || 50;

  const args = ['--no-playlist', '-f', `b[filesize<${maxMb}M]/best[ext=mp4]/best`, '-o', outputPath, url];

  logger.info(`Executing Facebook video download via execFile: ${url}`);

  try {
    await execFilePromise(binary, args, { timeout: 60000 });

    const files = fs.readdirSync(env.DOWNLOAD_PATH);
    const downloadedFile = files.find(f => f.startsWith(`fb_${timestamp}`));

    if (!downloadedFile) {
      throw new Error('Facebook video file not generated');
    }

    const fullFilePath = path.join(env.DOWNLOAD_PATH, downloadedFile);
    const stats = fs.statSync(fullFilePath);

    return {
      filePath: fullFilePath,
      fileName: downloadedFile,
      fileSize: stats.size,
      mediaType: 'video',
      title: 'Facebook Media'
    };
  } catch (error) {
    logger.error(`Facebook download failed: ${error.message}`);
    throw new Error(`Failed to download Facebook media: ${error.message}`);
  }
}
