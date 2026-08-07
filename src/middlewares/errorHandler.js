import logger from '../config/logger.js';

export function errorHandler(err, req, res, next) {
  logger.error(`Express API Error: ${err.message}`, { stack: err.stack, path: req.path });

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
}
