import path from 'path';
import fs from 'fs';
import axios from 'axios';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getYtDlpBinary, execFilePromise } from '../../utils/execHelper.js';

export async function downloadTikTok(url) {
  const timestamp = Date.now();
  const outputPath = path.join(env.DOWNLOAD_PATH, `tt_${timestamp}_%(id)s.%(ext)s`);
  const binary = getYtDlpBinary();

  const args = ['--no-warnings', '-o', outputPath, url];

  logger.info(`Executing TikTok download via execFile: ${url}`);

  try {
    await execFilePromise(binary, args, { timeout: 45000 });

    const files = fs.readdirSync(env.DOWNLOAD_PATH);
    const downloadedFile = files.find(f => f.startsWith(`tt_${timestamp}`));

    if (downloadedFile) {
      const fullFilePath = path.join(env.DOWNLOAD_PATH, downloadedFile);
      const stats = fs.statSync(fullFilePath);
      return {
        filePath: fullFilePath,
        fileName: downloadedFile,
        fileSize: stats.size,
        mediaType: 'video',
        title: 'TikTok Watermark-Free Video'
      };
    }
  } catch (err) {
    logger.warn(`yt-dlp TikTok extraction failed, attempting tikwm public API fallback: ${err.message}`);
  }

  // Fallback: TikWM API for watermark-free video
  try {
    const res = await axios.post('https://www.tikwm.com/api/', new URLSearchParams({ url, hd: '1' }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      timeout: 15000
    });

    if (res.data && res.data.code === 0 && res.data.data) {
      const videoUrl = res.data.data.play || res.data.data.wmplay;
      const localFile = path.join(env.DOWNLOAD_PATH, `tt_${timestamp}_nowatermark.mp4`);

      const writer = fs.createWriteStream(localFile);
      const response = await axios({ url: videoUrl, method: 'GET', responseType: 'stream' });
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      const stats = fs.statSync(localFile);
      return {
        filePath: localFile,
        fileName: path.basename(localFile),
        fileSize: stats.size,
        mediaType: 'video',
        title: res.data.data.title || 'TikTok Video'
      };
    }
  } catch (apiErr) {
    logger.error(`TikTok API fallback failed: ${apiErr.message}`);
  }

  throw new Error('Failed to download TikTok video. Link may be invalid or video is private.');
}
