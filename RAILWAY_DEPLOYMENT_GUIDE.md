# 🚀 Complete Railway Deployment Guide

This guide explains how to deploy your **aiogram 3.x Telegram Media Assistant & Multitool Bot** on [Railway](https://railway.app/).

---

## 📋 Step 1: Create a Railway Project
1. Log in to [Railway](https://railway.app/).
2. Click **"New Project"**.
3. Select **"Deploy from GitHub repo"**.

---

## 🔗 Step 2: Connect GitHub Repository
1. Grant Railway access to your GitHub repository `yukla_bot`.
2. Select the repository and choose the `main` or `master` branch.

---

## 🛠️ Step 3: Deploy Service
Railway automatically detects the root `Dockerfile` and `railway.json`.

---

## 🗄️ Step 4: Add PostgreSQL Database
1. Inside your Railway Project Dashboard, click **"+ New"**.
2. Select **"Database"** -> **"Add PostgreSQL"**.
3. Railway will provision a PostgreSQL instance.
4. Copy the environment variable `DATABASE_URL` or `POSTGRES_URL` from the PostgreSQL plugin settings.

---

## ⚡ Step 5: Add Redis Cache
1. Click **"+ New"**.
2. Select **"Database"** -> **"Add Redis"**.
3. Railway will provision a Redis instance.
4. Copy the `REDIS_URL` variable.

---

## 🔑 Step 6: Set Railway Variables

In your Railway Bot Service **Variables** tab, add the following environment variables:

| Variable Name | Value / Example | Description |
|---|---|---|
| `BOT_TOKEN` | `8796573326:AAEuEN...` | Telegram Bot Token from @BotFather |
| `OWNER_ID` | `5375935317` | Your Telegram Numeric ID |
| `ADMIN_IDS` | `5375935317` | Admin IDs (comma separated) |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-linked Railway PostgreSQL URL |
| `POSTGRES_DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-linked Railway PostgreSQL URL |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Auto-linked Railway Redis URL |
| `APP_ENV` | `production` | Set environment mode to production |
| `LOG_LEVEL` | `info` | Logging verbosity (`info` or `debug`) |
| `PORT` | `8000` | Railway HTTP port for health check |

---

## 🔄 Step 7: Restart & Verify Deployment

1. Once environment variables are set, Railway will automatically trigger a build and restart.
2. Verify the `/health` endpoint:
   ```bash
   curl -s https://<your-railway-app-domain>.up.railway.app/health
   ```
   **Expected Response:** `200 OK` `Bot Running`

3. Open your bot in Telegram and send `/start` or `/admin`!

---

## 🧪 Architecture & Auto Features
- **Auto Webhook / Polling Switcher**: If `WEBHOOK_HOST` or `RAILWAY_STATIC_URL` exists, Webhook mode activates automatically; otherwise, Polling mode is used.
- **Auto PostgreSQL Reconnect & Schema Migration**: SQLAlchemy 2.0 async engine creates all database tables automatically on startup.
- **Shazam & Music Finder**: Native audio signature recognition and YouTube Music MP3 extraction.
- **Social Media Downloader**: Non-blocking `yt-dlp` download engine for Instagram, YouTube, TikTok, Facebook, Pinterest, and Snapchat.
