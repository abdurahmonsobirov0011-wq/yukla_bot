import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

export async function connectDB() {
  // Disable command buffering so DB queries fail immediately instead of timing out
  mongoose.set('bufferCommands', false);
  mongoose.set('strictQuery', false);

  if (!env.MONGODB_URI) {
    logger.warn('⚠️ MONGODB_URI is empty. Running with local storage fallback.');
    return null;
  }

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
        logger.warn('⚠️ MongoDB connection lost. Running with local storage fallback...');
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
          logger.warn('⚠️ Development Mode: Running without MongoDB connection. Transient & local storage fallback active.');
          return null;
        }
      }
    }
  }
}

