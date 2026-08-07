import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import { downloadYouTube } from './extractors/youtube.js';
import logger from '../config/logger.js';
import env from '../config/env.js';

/**
 * Recognize music from an audio file/voice message using AudD / Shazam API
 * and download the full original MP3 song
 */
export async function recognizeAndDownloadMusic(audioFilePath) {
  logger.info(`Starting Shazam music recognition for file: ${audioFilePath}`);

  let songQuery = '';

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('return', 'apple_music,spotify');
    formData.append('api_token', env.AUDD_API_KEY || 'test');

    const response = await axios.post('https://api.audd.io/', formData, {
      headers: formData.getHeaders(),
      timeout: 15000
    });

    if (response.data && response.data.result) {
      const res = response.data.result;
      const artist = res.artist || '';
      const title = res.title || '';
      songQuery = `${artist} ${title}`.trim();
      logger.info(`✅ Shazam recognized song: "${songQuery}"`);
    }
  } catch (err) {
    logger.warn(`Shazam API recognition error: ${err.message}`);
  }

  // If Shazam recognition API did not return result
  if (!songQuery) {
    throw new Error("Qo'shiq tanilmadi. Iltimos, musiqaning sifatliroq va aniqroq qismini yuboring.");
  }

  logger.info(`Downloading full MP3 track for: "${songQuery}"...`);
  const searchUrl = `ytsearch1:${songQuery} audio`;
  const result = await downloadYouTube(searchUrl, 'audio');

  return {
    ...result,
    songTitle: songQuery
  };
}
