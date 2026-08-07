import path from 'path';
import fs from 'fs';
import axios from 'axios';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getYtDlpBinary, execFilePromise } from '../../utils/execHelper.js';

export async function downloadSnapchat(url) {
  const timestamp = Date.now();
  const outputPath = path.join(env.DOWNLOAD_PATH, `snap_${timestamp}_%(id)s.%(ext)s`);
  const binary = getYtDlpBinary();

  const args = ['--no-warnings', '-o', outputPath, url];

  logger.info(`Executing Snapchat download via execFile: ${url}`);

  try {
    await execFilePromise(binary, args, { timeout: 45000 });

    const files = fs.readdirSync(env.DOWNLOAD_PATH);
    const downloadedFile = files.find(f => f.startsWith(`snap_${timestamp}`));

    if (downloadedFile) {
      const fullFilePath = path.join(env.DOWNLOAD_PATH, downloadedFile);
      const stats = fs.statSync(fullFilePath);
      const ext = path.extname(downloadedFile).toLowerCase();

      return {
        filePath: fullFilePath,
        fileName: downloadedFile,
        fileSize: stats.size,
        mediaType: (ext === '.jpg' || ext === '.png' || ext === '.webp') ? 'image' : 'video',
        title: 'Snapchat Public Story'
      };
    }
  } catch (err) {
    logger.warn(`yt-dlp Snapchat extraction failed, attempting metadata parse: ${err.message}`);
  }

  // Fallback: Snapchat Public Story OpenGraph scraper
  try {
    const pageRes = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const videoMatch = pageRes.data.match(/<meta\s+property="og:video"\s+content="([^"]+)"/i) ||
                       pageRes.data.match(/<meta\s+name="twitter:player:stream"\s+content="([^"]+)"/i);
    const imageMatch = pageRes.data.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);

    const mediaUrl = videoMatch ? videoMatch[1] : (imageMatch ? imageMatch[1] : null);
    const isVideo = Boolean(videoMatch);

    if (mediaUrl) {
      const cleanUrl = mediaUrl.replace(/&amp;/g, '&');
      const ext = isVideo ? '.mp4' : '.jpg';
      const localFile = path.join(env.DOWNLOAD_PATH, `snap_${timestamp}${ext}`);

      const writer = fs.createWriteStream(localFile);
      const response = await axios({ url: cleanUrl, method: 'GET', responseType: 'stream' });
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
        mediaType: isVideo ? 'video' : 'image',
        title: 'Snapchat Public Media'
      };
    }
  } catch (apiErr) {
    logger.error(`Snapchat page fallback failed: ${apiErr.message}`);
  }

  throw new Error('Failed to extract Snapchat media. Story may have expired or is private.');
}
