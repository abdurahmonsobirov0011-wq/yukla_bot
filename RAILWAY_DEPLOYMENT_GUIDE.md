# 🚀 Railway.app da Botni 24/7 Bepul/Bulutda Ishga Tushirish Qo'llanmasi

Ushbu yo'riqnoma orqali botingizni Railway serveriga joylashtirasiz. Bot kompyuteringiz o'chirilgan bo'lsa ham **24/7 uzluksiz** ishlayveradi.

---

### 1-Qadam: GitHub'ga Yuklash
Loyiha kodlarini o'zingizning GitHub hisobingizdagi repozitoriyga `git push` qiling.

```bash
git add .
git commit -m "Railway deployment commit"
git push origin main
```

---

### 2-Qadam: Railway.app da Loyiha Yaratish
1. [Railway.app](https://railway.app) saytiga kiring va GitHub hisobingiz orqali kiring (`Login with GitHub`).
2. **New Project** tugmasini bosing.
3. **Deploy from GitHub repo** menyusini tanlang.
4. `yukla_bot` (yoki bot repozitoriyingizni) tanlang.

---

### 3-Qadam: O'zgaruvchilarni (Variables) Kiritish
Railway dashboard'ida loyihangizni ustiga bosing va **Variables** bo'limiga o'ting.

Quyidagi o'zgaruvchilarni qo'shing:

| Variable Name | Qiymati (Misol) | Izoh |
| :--- | :--- | :--- |
| `BOT_TOKEN` | `8796573326:AAEuENJNV...` | Telegram Bot Tokeningiz (@BotFather dan) |
| `ADMIN_IDS` | `5375935317` | Admin Telegram ID laringiz |
| `NODE_ENV` | `production` | Ishga tushirish rejimi |
| `PORT` | `3000` | Server porti |
| `MAX_FILE_SIZE` | `50` | Maksimal fayl hajmi MB da |
| `JWT_SECRET` | `super_secret_jwt_key_32_chars_long!!` | Admin paneli kaliti |
| `ADMIN_PASSWORD` | `SizningParolingiz123` | Admin paneli paroli |

*(Ixtiyoriy)* Agar MongoDB bazangiz bo'lsa, Railway'da **Add Database -> MongoDB** ni tanlab, uning `MONGODB_URI` ulanish manzilini ham qo'shishingiz mumkin.

---

### 4-Qadam: Ishga Tushishini Tekshirish
Variables qo'shilgach, Railway avtomatik ravishda Docker build'ni boshlaydi:
- Railway `Dockerfile` orqali Node.js, `FFmpeg` va `yt-dlp` ni yuklab olib botni ishga tushiradi.
- **Deployments** bo'limida `Active` va yashil chiroq yonsa, botingiz **24/7 ONLINE** va kompyuteringiz o'chiq bo'lsa ham ishlayveradi!
