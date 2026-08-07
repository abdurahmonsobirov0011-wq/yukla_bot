import { execFile, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import logger from '../config/logger.js';

export function getYtDlpBinary() {
  const localExe = path.resolve('yt-dlp.exe');
  if (fs.existsSync(localExe)) {
    return localExe;
  }
  return 'yt-dlp';
}

export function getFfmpegBinary() {
  const localExe = path.resolve('ffmpeg.exe');
  if (fs.existsSync(localExe)) {
    return localExe;
  }
  const staticExe = path.resolve('node_modules/ffmpeg-static/ffmpeg.exe');
  if (fs.existsSync(staticExe)) {
    return staticExe;
  }
  return 'ffmpeg';
}

export function execFilePromise(file, args, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 60000;
    execFile(file, args, { ...options, timeout }, (error, stdout, stderr) => {
      if (error) {
        error.stderr = stderr;
        error.stdout = stdout;
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

export async function probeMediaInfo(url) {
  const binary = getYtDlpBinary();
  const ffmpegBin = getFfmpegBinary();
  try {
    const args = [
      '--no-playlist',
      '--dump-json',
      '--no-warnings',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      '--extractor-args', 'youtube:player_client=android,web'
    ];
    if (ffmpegBin) {
      args.push('--ffmpeg-location', ffmpegBin);
    }
    args.push(url);

    const { stdout } = await execFilePromise(binary, args, { timeout: 20000 });

    const meta = JSON.parse(stdout);
    const filesizeBytes = meta.filesize || meta.filesize_approx || 0;
    const filesizeMb = filesizeBytes ? (filesizeBytes / (1024 * 1024)) : 0;

    return {
      title: meta.title || 'Media',
      durationSeconds: meta.duration || 0,
      filesizeMb,
      artist: meta.artist || meta.creator || meta.uploader || '',
      track: meta.track || meta.alt_title || meta.title || ''
    };
  } catch (err) {
    logger.warn(`Media pre-probe skipped for ${url}: ${err.message}`);
    return null;
  }
}

export function checkSystemBinaries() {
  logger.info('Performing boot-time system binary health checks...');

  try {
    const binary = getYtDlpBinary();
    const version = execSync(`"${binary}" --version`, { encoding: 'utf8', timeout: 5000 }).trim();
    logger.info(`✅ yt-dlp detected (Version: ${version})`);
  } catch (err) {
    logger.warn('⚠️ yt-dlp binary was not found on PATH or local folder!');
  }

  try {
    const ffmpegBin = getFfmpegBinary();
    const ffmpegVer = execSync(`"${ffmpegBin}" -version`, { encoding: 'utf8', timeout: 5000 }).split('\n')[0];
    logger.info(`✅ FFmpeg detected (${ffmpegVer}) at: ${ffmpegBin}`);
  } catch (err) {
    logger.warn("⚠️ ffmpeg PATH'da ham, lokal papkada ham topilmadi.");
  }
}

