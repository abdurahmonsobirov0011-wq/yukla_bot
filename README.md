# 🚀 Full Stack Telegram Media Downloader Bot

A production-ready, highly optimized, secure, and clean architecture Telegram Bot built with **Node.js (latest LTS)**, **Telegraf**, **Express**, **MongoDB (Mongoose)**, **yt-dlp**, and **FFmpeg**.

It automatically extracts and downloads high-quality media from **Instagram**, **YouTube**, **TikTok**, **Facebook**, **Pinterest**, and **Snapchat** simply when a user sends a link. Includes a full feature **Web Admin Dashboard** with real-time analytics, user management, and broadcast controls.

---

## 🌟 Key Features

- 📸 **Instagram**: Reels, Video Posts, and Stories.
- 📺 **YouTube**: High-definition Videos, Shorts, and MP3 Audio extraction.
- 🎵 **TikTok**: Watermark-free HD Video extraction.
- 👥 **Facebook**: Public Videos and Reels.
- 📌 **Pinterest**: High-resolution Images and Video Pins.
- 👻 **Snapchat**: Public Stories and Spotlight Videos.
- 🎁 **Referral System**: Unique referral link for every user, referral tracking, and real-time leaderboard (`t.me/bot?start=ref_CODE`).
- ⭐ **Premium System**: Priority processing queue, higher file limits, and admin status toggles.
- 🖥️ **Web Admin Dashboard**: Real-time stats (Users, Downloads, System RAM/CPU/Disk load, Platform breakdown, Broadcast tool, Ban/Unban user manager, Live logs).
- 🛡️ **Security & Anti-Spam**: Rate-limiting, Helmet security headers, CORS protection, and Banned user blacklisting.
- 🧹 **Automatic File Cleanup**: Instant temp file removal post-delivery + scheduled hourly background cleanup.

---

## 📂 Project Structure

```
telegram-downloader-bot/
├── src/
│   ├── config/
│   │   ├── env.js                # Environment variables configuration & validation
│   │   ├── logger.js             # Winston logger setup (console + file transports)
│   │   └── database.js           # Mongoose MongoDB connection & error handling
│   ├── models/
│   │   ├── User.js               # Telegram User schema (Telegram ID, referral, premium, stats)
│   │   ├── DownloadLog.js        # Download analytics schema
│   │   └── Blacklist.js          # Blacklisted users schema
│   ├── utils/
│   │   ├── urlDetector.js        # Platform identifier regex & parser
│   │   ├── systemStats.js        # CPU, RAM, Disk usage stats helper
│   │   └── formatter.js          # Byte size, time, markdown string formatters
│   ├── services/
│   │   ├── extractors/
│   │   │   ├── youtube.js        # YouTube videos, Shorts & MP3 audio extractor
│   │   │   ├── instagram.js      # Instagram Reels, Posts, Stories extractor
│   │   │   ├── tiktok.js         # TikTok watermark-free video extractor
│   │   │   ├── facebook.js       # Facebook Videos & Reels extractor
│   │   │   ├── pinterest.js      # Pinterest Images & Videos extractor
│   │   │   └── snapchat.js       # Snapchat public media extractor
│   │   ├── downloaderService.js  # Main orchestrator for media downloads
│   │   ├── fileService.js        # File size check, temp file cleanup & cron cleaner
│   │   └── statsService.js       # Aggregation query service for stats & charts
│   ├── telegram/
│   │   ├── middlewares/
│   │   │   ├── userMiddleware.js # Auto-register user, update last active & track referrals
│   │   │   ├── rateLimitMiddleware.js # Telegraf anti-spam rate limiter
│   │   │   └── blacklistMiddleware.js # Block banned users
│   │   ├── commands/
│   │   │   ├── start.js          # /start command & referral parser
│   │   │   ├── help.js           # /help command & instructions
│   │   │   ├── about.js          # /about bot & system info
│   │   │   ├── stats.js          # /stats command (user & global stats)
│   │   │   ├── premium.js        # /premium benefits & status command
│   │   │   ├── admin.js          # /admin Telegram admin menu & controls
│   │   │   └── referral.js       # /referral link, stats & leaderboard
│   │   ├── handlers/
│   │   │   ├── urlHandler.js     # Intercept user link, route to downloader, send file
│   │   │   └── callbackHandler.js# Handle inline buttons
│   │   └── bot.js                # Telegraf bot initialization & middleware registration
│   ├── controllers/
│   │   ├── adminController.js    # Express HTTP API for Web Admin Dashboard
│   │   └── statsController.js    # Express HTTP API for charts & system stats
│   ├── middlewares/
│   │   ├── auth.js               # JWT Admin authentication middleware
│   │   ├── rateLimiter.js        # Express rate limiter middleware
│   │   └── errorHandler.js      # Global Express error handler
│   ├── routes/
│   │   ├── adminRoutes.js        # /api/admin endpoints
│   │   └── statsRoutes.js        # /api/stats endpoints
│   ├── app.js                    # Express app initialization
│   └── server.js                 # Entry point: DB connection, Express startup, Telegraf bot launch
├── public/
│   └── admin/
│       ├── index.html            # Responsive Admin Dashboard SPA UI
│       ├── styles.css            # Dark mode UI styling with Glassmorphism & charts
│       └── app.js                # Admin dashboard JS logic & Chart.js integration
├── logs/                         # Winston log files output directory
├── downloads/                    # Temporary media download workspace
├── Dockerfile                    # Multi-stage production Docker container configuration
├── docker-compose.yml            # Docker compose with Node app & MongoDB container
├── ecosystem.config.js           # PM2 configuration script for production VPS deployment
├── nginx.conf                    # Nginx reverse proxy configuration file
├── package.json                  # Dependencies & ES Modules declaration
├── README.md                     # Comprehensive installation & deployment guide
└── .env.example                  # Environment configuration template
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js** v20.x (LTS) or higher
- **MongoDB** running locally or via MongoDB Atlas
- **FFmpeg** and **yt-dlp** installed on system PATH
  - *Ubuntu/Debian:* `sudo apt update && sudo apt install -y ffmpeg python3-pip && sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod a+rx /usr/local/bin/yt-dlp`
  - *Windows:* `winget install Gyan.FFmpeg` and `winget install yt-dlp`

### 2. Installation
```bash
git clone <repository-url>
cd telegram-downloader-bot
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
Key variables:
- `BOT_TOKEN`: Token obtained from Telegram [@BotFather](https://t.me/BotFather).
- `MONGODB_URI`: Connection string (e.g. `mongodb://localhost:27017/telegram_downloader_db`).
- `ADMIN_IDS`: Comma-separated Telegram User IDs for Admin authorization (e.g. `123456789,987654321`).
- `ADMIN_PASSWORD`: Master password used to log into Web Admin Dashboard (`http://localhost:3000/admin`).

### 4. Running the Bot
```bash
npm start
```
Or with auto-reload:
```bash
npm run dev
```

---

## 🐳 Docker Deployment

To launch the full stack (Node App + MongoDB) using Docker:

```bash
docker-compose up -d --build
```
Check container logs:
```bash
docker-compose logs -f app
```

---

## 🌐 Ubuntu 24.04 VPS Deployment Guide (PM2 + Nginx + SSL)

### Step 1: Update VPS & Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ffmpeg python3 python3-pip nginx
```

### Step 2: Install Node.js 20 LTS & PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2 yt-dlp
```

### Step 3: Install MongoDB Community Server
```bash
sudo apt install -y gnupg curl
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Step 4: Clone & Start Application with PM2
```bash
git clone <repository-url> /var/www/telegram-downloader-bot
cd /var/www/telegram-downloader-bot
npm install --production
cp .env.example .env
# Edit your .env file
nano .env

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Step 5: Configure Nginx Reverse Proxy
Copy `nginx.conf` content to `/etc/nginx/sites-available/bot`:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/bot
# Edit domain name in /etc/nginx/sites-available/bot
sudo nano /etc/nginx/sites-available/bot

sudo ln -s /etc/nginx/sites-available/bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: SSL Setup (Let's Encrypt Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🤖 Telegram Bot Commands

| Command | Description |
| :--- | :--- |
| `/start` | Welcome message, main feature menu & referral code detection |
| `/help` | Detailed guide on supported platforms and download formats |
| `/about` | Technical bot details, architecture & privacy policy |
| `/stats` | View personal download count & global system metrics |
| `/premium` | View premium status and benefits overview |
| `/referral` | Get your personal referral link, stats & leaderboard |
| `/admin` | Admin control panel (Broadcast, Ban, Unban, Premium toggle) |

### Admin Commands (Telegram Chat)
- `/admin broadcast <Message>`: Send announcement to all registered users.
- `/admin ban <Telegram_ID>`: Ban a user.
- `/admin unban <Telegram_ID>`: Unban a user.
- `/admin premium <Telegram_ID>`: Toggle premium status for a user.

---

## 🔌 REST API Endpoints (Admin Web Dashboard)

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/login` | Authenticate admin with password | Public |
| `GET` | `/api/admin/users` | List paginated users with search filter | Bearer JWT |
| `POST` | `/api/admin/ban` | Ban or unban user | Bearer JWT |
| `POST` | `/api/admin/premium` | Grant or revoke user premium status | Bearer JWT |
| `POST` | `/api/admin/broadcast` | Send broadcast notification to users | Bearer JWT |
| `GET` | `/api/admin/logs` | Fetch real-time system log output | Bearer JWT |
| `GET` | `/api/stats` | Get dashboard summary & hardware stats | Bearer JWT |
| `GET` | `/api/stats/charts` | Get 7-day download & user growth chart data | Bearer JWT |

---

## 🛠️ Troubleshooting

1. **yt-dlp is out of date / download errors:**
   - Run `sudo yt-dlp -U` to update yt-dlp to the latest release.
2. **MongoDB Connection Failed:**
   - Verify MongoDB service status: `sudo systemctl status mongod`.
3. **Telegram Bot Not Responding:**
   - Check `logs/error.log` or run `pm2 logs`.
   - Ensure `BOT_TOKEN` in `.env` is correct and not revoked.

---

## 📄 License
This project is released under the **MIT License**.
