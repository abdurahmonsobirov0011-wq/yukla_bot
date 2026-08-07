import path from 'path';
import fs from 'fs';
import axios from 'axios';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getYtDlpBinary, execFilePromise } from '../../utils/execHelper.js';

export async function downloadPinterest(url) {
  const timestamp = Date.now();
  const outputPath = path.join(env.DOWNLOAD_PATH, `pin_${timestamp}_%(id)s.%(ext)s`);
  const binary = getYtDlpBinary();

  const args = ['--no-warnings', '-o', outputPath, url];

  logger.info(`Executing Pinterest download via execFile: ${url}`);

  try {
    await execFilePromise(binary, args, { timeout: 45000 });

    const files = fs.readdirSync(env.DOWNLOAD_PATH);
    const downloadedFile = files.find(f => f.startsWith(`pin_${timestamp}`));

    if (downloadedFile) {
      const fullFilePath = path.join(env.DOWNLOAD_PATH, downloadedFile);
      const stats = fs.statSync(fullFilePath);
      const ext = path.extname(downloadedFile).toLowerCase();

      return {
        filePath: fullFilePath,
        fileName: downloadedFile,
        fileSize: stats.size,
        mediaType: (ext === '.jpg' || ext === '.png' || ext === '.webp') ? 'image' : 'video',
        title: 'Pinterest Media'
      };
    }
  } catch (err) {
    logger.warn(`yt-dlp Pinterest extraction failed, attempting page image parse: ${err.message}`);
  }

  // Fallback: Scraping high-res image from Pinterest pin URL
  try {
    const htmlRes = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 15000
    });

    const imgMatch = htmlRes.data.match(/https:\/\/i\.pinimg\.com\/originals\/[a-zA-Z0-9\/_.-]+\.(?:jpg|jpeg|png|gif|webp)/i) ||
                     htmlRes.data.match(/https:\/\/i\.pinimg\.com\/736x\/[a-zA-Z0-9\/_.-]+\.(?:jpg|jpeg|png|gif|webp)/i);

    if (imgMatch) {
      const mediaUrl = imgMatch[0];
      const ext = path.extname(mediaUrl) || '.jpg';
      const localFile = path.join(env.DOWNLOAD_PATH, `pin_${timestamp}_image${ext}`);

      const writer = fs.createWriteStream(localFile);
      const response = await axios({ url: mediaUrl, method: 'GET', responseType: 'stream' });
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
        mediaType: 'image',
        title: 'Pinterest Image Pin'
      };
    }
  } catch (apiErr) {
    logger.error(`Pinterest HTML fallback failed: ${apiErr.message}`);
  }

  throw new Error('Failed to download Pinterest media.');
}
