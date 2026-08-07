import fs from 'fs';
import path from 'path';
import cron from 'node-cron';
import env from '../config/env.js';
import logger from '../config/logger.js';

/**
 * Safely delete a file if it exists
 */
export function deleteFile(filePath) {
  if (!filePath) return;
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`Deleted temporary file: ${filePath}`);
    }
  } catch (error) {
    logger.error(`Error deleting file ${filePath}: ${error.message}`);
  }
}

/**
 * Clean up files in downloads folder older than maxAgeMinutes (default 30 min)
 */
export function cleanupTempFiles(maxAgeMinutes = 30) {
  const dirPath = env.DOWNLOAD_PATH;
  if (!fs.existsSync(dirPath)) return;

  const now = Date.now();
  const cutoff = now - maxAgeMinutes * 60 * 1000;

  try {
    const files = fs.readdirSync(dirPath);
    let deletedCount = 0;

    for (const file of files) {
      if (file === '.gitkeep') continue;
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.mtimeMs < cutoff) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info(`Scheduled Cleanup: Removed ${deletedCount} temporary file(s).`);
    }
  } catch (error) {
    logger.error(`Error during temp files cleanup: ${error.message}`);
  }
}

/**
 * Initialize hourly cron job for automatic cleanup
 */
export function initCleanupCron() {
  // Run at minute 0 of every hour
  cron.schedule('0 * * * *', () => {
    logger.info('Running hourly download directory cleanup job...');
    cleanupTempFiles(30);
  });
  logger.info('Hourly file cleanup cron job initialized.');
}
