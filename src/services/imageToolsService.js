import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import env from '../config/env.js';
import logger from '../config/logger.js';

export async function compressAndOptimizeImage(imagePath) {
  const timestamp = Date.now();
  const outputPath = path.join(env.DOWNLOAD_PATH, `opt_${timestamp}.jpg`);

  try {
    await sharp(imagePath)
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    return {
      filePath: outputPath,
      fileSize: stats.size
    };
  } catch (err) {
    logger.error(`Image compression failed: ${err.message}`);
    throw new Error('Rasm hajmini qisqartirishda xatolik yuz berdi.');
  }
}
