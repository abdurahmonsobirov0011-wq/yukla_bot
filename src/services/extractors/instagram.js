import path from 'path';
import fs from 'fs';
import axios from 'axios';
import env from '../../config/env.js';
import logger from '../../config/logger.js';
import { getYtDlpBinary, getFfmpegBinary, execFilePromise } from '../../utils/execHelper.js';

export async function downloadInstagram(url) {
  const timestamp = Date.now();
  const outputPath = path.join(env.DOWNLOAD_PATH, `ig_${timestamp}_%(id)s.%(ext)s`);
  const binary = getYtDlpBinary();
  const ffmpegBin = getFfmpegBinary();

  const args = [
    '--no-playlist',
    '--no-warnings',
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    '-f', 'b/best',
    '-o', outputPath
  ];

  if (ffmpegBin) {
    args.push('--ffmpeg-location', ffmpegBin);
  }
  args.push(url);


  logger.info(`Executing Instagram download via execFile: ${url}`);
  
  try {
    await execFilePromise(binary, args, { timeout: 45000 });
    
    const files = fs.readdirSync(env.DOWNLOAD_PATH);
    const downloadedFile = files.find(f => f.startsWith(`ig_${timestamp}`));

    if (downloadedFile) {
      const fullFilePath = path.join(env.DOWNLOAD_PATH, downloadedFile);
      const stats = fs.statSync(fullFilePath);
      const ext = path.extname(downloadedFile).toLowerCase();

      return {
        filePath: fullFilePath,
        fileName: downloadedFile,
        fileSize: stats.size,
        mediaType: (ext === '.jpg' || ext === '.png' || ext === '.webp') ? 'image' : 'video',
        title: 'Instagram Media'
      };
    }
  } catch (err) {
    logger.warn(`yt-dlp Instagram extraction failed, trying fast API fallback: ${err.message}`);
  }

  // Fast API Fallback for Instagram
  try {
    const apiRes = await axios.post(`https://api.cobalt.tools/api/json`, { url }, {
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      timeout: 15000
    }).catch(() => null);

    if (apiRes && apiRes.data && apiRes.data.url) {
      const mediaUrl = apiRes.data.url;
      const localFile = path.join(env.DOWNLOAD_PATH, `ig_${timestamp}_media.mp4`);
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
        mediaType: 'video',
        title: 'Instagram Post'
      };
    }
  } catch (apiErr) {
    logger.error(`Instagram API fallback failed: ${apiErr.message}`);
  }

  throw new Error('Unable to extract Instagram media. Link may be private or restricted.');
}
