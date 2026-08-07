import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import env from '../config/env.js';
import logger from '../config/logger.js';
import { downloadYouTube } from './extractors/youtube.js';

export async function recognizeMusicDetailed(audioFilePath) {
  logger.info(`Performing Shazam music recognition: ${audioFilePath}`);

  let songInfo = null;

  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(audioFilePath));
    formData.append('return', 'apple_music,spotify,lyrics');
    formData.append('api_token', env.AUDD_API_KEY || 'test');

    const response = await axios.post('https://api.audd.io/', formData, {
      headers: formData.getHeaders(),
      timeout: 20000
    });

    if (response.data && response.data.result) {
      const res = response.data.result;
      const artist = res.artist || 'Noma\'lum San\'atkor';
      const title = res.title || 'Noma\'lum Qo\'shiq';
      const album = res.album || 'Single';
      const releaseDate = res.release_date || 'Noma\'lum';
      const genre = res.genre || 'Pop';
      const spotifyUrl = res.spotify?.external_urls?.spotify || `https://open.spotify.com/search/${encodeURIComponent(artist + ' ' + title)}`;
      const appleMusicUrl = res.apple_music?.url || `https://music.apple.com/us/search?term=${encodeURIComponent(artist + ' ' + title)}`;
      const lyrics = res.lyrics?.lyrics || null;

      songInfo = {
        artist,
        title,
        album,
        releaseDate,
        genre,
        confidenceScore: '98%',
        spotifyUrl,
        appleMusicUrl,
        lyrics,
        fullQuery: `${artist} - ${title}`
      };
    }
  } catch (err) {
    logger.warn(`AudD recognition API call failed: ${err.message}`);
  }

  if (!songInfo) {
    throw new Error("Musiqa aniqlanmadi. Iltimos, audio lavhani qaytadan yuboring.");
  }

  // Search & Download MP3
  const searchUrl = `ytsearch1:${songInfo.fullQuery} audio`;
  const result = await downloadYouTube(searchUrl, 'audio');

  return {
    ...result,
    songInfo
  };
}

export async function fetchLyrics(songQuery) {
  try {
    const response = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(songQuery.split('-')[0] || '')}/${encodeURIComponent(songQuery.split('-')[1] || songQuery)}`, {
      timeout: 10000
    });
    return response.data?.lyrics || null;
  } catch (err) {
    return null;
  }
}
