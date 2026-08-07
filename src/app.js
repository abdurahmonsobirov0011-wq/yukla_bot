import express from 'express';

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

export default app;
