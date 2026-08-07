import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

export async function connectDB() {
  if (!env.MONGODB_URI) {
    logger.warn('⚠️ MONGODB_URI is empty. Database functions will be disabled in development mode.');
    return null;
  }

  // Disable command buffering so DB queries fail immediately instead of timing out
  mongoose.set('bufferCommands', false);
  mongoose.set('strictQuery', false);

  const maxRetries = 3;
  const retryIntervalMs = 3000;
  let attempts = 0;

  while (attempts < maxRetries) {
    attempts++;
    try {
      logger.info(`Connecting to MongoDB (Attempt ${attempts}/${maxRetries})...`);
      const conn = await mongoose.connect(env.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 5000
      });

      logger.info(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);

      mongoose.connection.on('error', (err) => {
        logger.error(`MongoDB runtime connection error: ${err.message}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB connection lost. Attempting auto-reconnect...');
      });

      return conn;
    } catch (error) {
      logger.error(`MongoDB connection attempt ${attempts} failed: ${error.message}`);

      if (attempts < maxRetries) {
        logger.info(`Retrying MongoDB connection in ${retryIntervalMs / 1000} seconds...`);
        await new Promise((res) => setTimeout(res, retryIntervalMs));
      } else {
        if (env.NODE_ENV === 'production') {
          logger.error('❌ FATAL: Could not connect to MongoDB after maximum retry attempts in production.');
          process.exit(1);
        } else {
          logger.warn('⚠️ Development Mode: Running without MongoDB connection. Transient caching active.');
          return null;
        }
      }
    }
  }
}
