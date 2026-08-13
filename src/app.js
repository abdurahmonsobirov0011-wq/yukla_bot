import express from 'express';
import env from './config/env.js';

const app = express();

app.get('/health', (req, res) => res.json({
  status: 'OK',
  uptime: Math.floor(process.uptime()),
  timestamp: new Date().toISOString()
}));

app.get('/', (req, res) => res.json({
  status: 'OK',
  message: 'Telegram Bot service is running. Admin panel removed — all controls via Telegram.'
}));

// Serve downloaded files statically for direct web download link fallback
app.use('/downloads', express.static(env.DOWNLOAD_PATH));

export default app;

