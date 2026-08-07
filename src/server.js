import app from './app.js';
import env, { validateEnv } from './config/env.js';
import { connectDB } from './config/database.js';
import { createBot } from './telegram/bot.js';
import { initCleanupCron } from './services/fileService.js';
import { checkSystemBinaries } from './utils/execHelper.js';
import logger from './config/logger.js';

async function startServer() {
  logger.info('Starting Telegram Downloader Bot service...');

  validateEnv();
  checkSystemBinaries();
  await connectDB();
  initCleanupCron();

  const bot = createBot();
  if (bot) {
    bot.launch({ dropPendingUpdates: true }).then(() => {
      logger.info('🤖 Telegram Bot polling started successfully.');
    }).catch(err => {
      logger.error(`Failed to launch Telegram Bot polling: ${err.message}`);
    });
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 Health-check server running on port ${env.PORT}`);
  });

  const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);
    if (bot) bot.stop(signal);
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer().catch(err => {
  logger.error(`Fatal startup error: ${err.message}`, { stack: err.stack });
  process.exit(1);
});
