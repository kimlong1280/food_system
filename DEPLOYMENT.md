# 🚀 Deployment Guide: SreyKeo Coffee & Soup

This guide details how to deploy your full-stack restaurant system online using **Vercel** (Frontend) and **Render** (Backend & PostgreSQL Database) for free.

---

## Architecture Overview

```
Customer & Admin Browsers
         │
         ▼
[ Vercel (Frontend React SPA) ]
  URL: https://food-system-sk.vercel.app
         │
         │ API Requests (VITE_API_URL)
         ▼
[ Render (Laravel 12 Backend Web Service) ]
  URL: https://food-system-backend-uroh.onrender.com
         │
         ├──► [ Render Free Managed PostgreSQL Database ]
         │
         └──► [ Telegram Bot API (Live Orders & Bill Alerts) ]
```

---

## Step 1: Push Code to GitHub

1. Open [GitHub](https://github.com/new) and create a **New Repository** (e.g. `food_system`). Keep it Private or Public.
2. In your terminal, link your repository and push the code:

```bash
git remote add origin https://github.com/YOUR_USERNAME/food_system.git
git push -u origin main
```

---

## Step 2: Deploy Backend & Database on Render (Free)

1. Go to [Render.com](https://render.com) and sign in with your GitHub account.
2. Click **New +** > **Blueprint**.
3. Select your `food_system` repository.
4. Render will automatically detect [`render.yaml`](./render.yaml):
   - **PostgreSQL Database** (`food-system-db`)
   - **Backend Web Service** (`food-system-backend`) using Docker
5. Click **Apply**.
6. In the Backend Web Service settings on Render, configure the following Environment Variables under **Environment**:
   - `APP_KEY`: Generate one locally via `php artisan key:generate --show` or paste 32 random characters: `base64:...`
   - `APP_URL`: Your Render backend URL (e.g., `https://food-system-backend.onrender.com`)
   - `FRONTEND_URL`: Your Vercel domain once created (e.g., `https://sreykeo.vercel.app`)
   - `TELEGRAM_BOT_TOKEN`: Your Telegram Bot Token
   - `TELEGRAM_CHAT_ID`: Your Telegram Group or Channel ID
7. To seed default menu items and admin credentials, open the **Shell** tab on Render and run:
```bash
php artisan db:seed --force
```

---

## Step 3: Deploy Frontend on Vercel (Free)

1. Go to [Vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New...** > **Project**.
3. Select your `food_system` repository and click **Import**.
4. Configure Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: Click `Edit` and choose `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **Environment Variables**, add:
    - `VITE_API_URL`: `https://food-system-backend-uroh.onrender.com/api`
6. Click **Deploy**.

Vercel will build and launch your website with a free SSL certificate (e.g., `https://food-system-sk.vercel.app`) in under 60 seconds!

---

## Step 4: Final Link

1. Copy your live Vercel URL (e.g. `https://food-system-sk.vercel.app`).
2. Go back to Render > **food-system-backend** > **Environment**.
3. Update `FRONTEND_URL` to your Vercel URL.
4. Render will auto-redeploy to apply the updated CORS origin.

Your website is now 100% online and accessible worldwide on smartphones, tablets, and computers!
