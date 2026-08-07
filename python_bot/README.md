# TezYukla Pro Enterprise Bot

Python 3.12, Aiogram 3, PostgreSQL, Redis, FFmpeg va yt-dlp asosidagi production Telegram media bot.

## Ishlaydigan imkoniyatlar

- Instagram, YouTube, TikTok, Facebook, Pinterest, Snapchat, X/Twitter, Threads, Reddit, Vimeo, Dailymotion, SoundCloud, Likee, Bilibili, VK, Tumblr uchun `yt-dlp` orqali real yuklash.
- Video sifat tanlash: 144p dan 4K gacha, mavjud formatga qarab.
- Audio MP3: 64/128/192/256/320 kbps.
- Audio/video/voice orqali Shazam: AudD yoki ACRCloud.
- Musiqa va video qidirish: Spotify API mavjud bo‘lsa metadata, aks holda YouTube search.
- PostgreSQL/SQLite, Redis, cache, download log, admin API.
- Majburiy kanal obunasi, rate limit, ban/unban.
- Docker, Nginx, systemd service, backup script.

## O‘rnatish

```bash
cd python_bot
cp .env.example .env
python -m venv .venv
. .venv/bin/activate
pip install -U pip
pip install ".[dev]"
python -m app.main
```

Windows PowerShell:

```powershell
cd python_bot
Copy-Item .env.example .env
py -3.12 -m venv .venv
.venv\Scripts\Activate.ps1
pip install -U pip
pip install ".[dev]"
python -m app.main
```

## Docker

```bash
cd python_bot
cp .env.example .env
docker compose up -d --build
```

Production uchun `.env` ichida kamida:

- `BOT_TOKEN`
- `POSTGRES_DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `AUDD_API_KEY` yoki ACRCloud credentiallari
- `SPOTIFY_CLIENT_ID` va `SPOTIFY_CLIENT_SECRET`

## Admin API

Admin server Docker compose’da `http://localhost:8080` portida ishlaydi.

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"change-me"}'
```

Token bilan:

```bash
curl http://localhost:8080/stats -H "Authorization: Bearer TOKEN"
```

## Ubuntu deployment

```bash
sudo mkdir -p /opt/tezyukla
sudo cp -r python_bot /opt/tezyukla/
cd /opt/tezyukla/python_bot
cp .env.example .env
nano .env
docker compose up -d --build
sudo cp scripts/tezyukla-bot.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now tezyukla-bot
```

SSL uchun domenni serverga yo‘naltiring va `nginx/default.conf` ni domen nomi bilan yangilang. Certbot yoki Cloudflare Origin cert ishlatish mumkin.

## Test

```bash
pytest
ruff check .
```

## Muhim eslatma

Platformalar yuklashi `yt-dlp` qo‘llab-quvvatlashiga va platforma cheklovlariga bog‘liq. Private kontent, login talab qiladigan story/highlightlar yoki DRM himoyalangan media uchun cookie/auth konfiguratsiyasi kerak bo‘ladi.

