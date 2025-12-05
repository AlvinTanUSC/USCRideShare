# Quick Deployment Guide

Follow these steps to deploy your USC RideShare application in under 15 minutes.

## Prerequisites Checklist

- [ ] Code pushed to GitHub
- [ ] Supabase database connection string ready
- [ ] Render account created
- [ ] Vercel account created

---

## Step 1: Deploy Backend (5 minutes)

### 1.1 Create Render Service

1. Go to https://render.com/dashboard
2. Click **New +** → **Web Service**
3. Connect GitHub and select **USCRideShare** repo
4. Render will auto-detect the `render.yaml` config
5. Click **Create Web Service**

### 1.2 Add Environment Variables

In the Render dashboard, add these variables:

```
DATABASE_URL = postgresql://postgres.xxxxx:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
JWT_SECRET = [Run: openssl rand -base64 32]
JWT_EXPIRATION_MS = 86400000
SPRING_PROFILES_ACTIVE = prod
```

**Get your DATABASE_URL from Supabase:**
- Dashboard → Project → Settings → Database → Connection String

### 1.3 Wait for Build

- Build takes 3-5 minutes
- Your backend URL: `https://[your-service-name].onrender.com`
- Test: `https://[your-service-name].onrender.com/actuator/health`

---

## Step 2: Deploy Frontend (5 minutes)

### 2.1 Deploy to Vercel

1. Go to https://vercel.com/dashboard
2. Click **Add New...** → **Project**
3. Import **USCRideShare** from GitHub
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite (auto-detected)
   - Keep other defaults

### 2.2 Add Environment Variables

Before deploying, click **Environment Variables** and add:

```
VITE_API_URL = https://[your-render-backend-url].onrender.com
VITE_GOOGLE_CLIENT_ID = 205644706714-jm6k9ot6qq83v9k73js4g896aaui4kdc.apps.googleusercontent.com
```

### 2.3 Deploy

- Click **Deploy**
- Wait 1-2 minutes
- Your frontend URL: `https://[your-project-name].vercel.app`

---

## Step 3: Test Your Deployment

1. Visit your Vercel URL
2. Try logging in
3. Check browser console for errors
4. Test key features (ride creation, matching, etc.)

---

## Common Issues

### Backend won't start
- Check Render logs for database connection errors
- Verify DATABASE_URL is correct and password is URL-encoded
- Check if Hibernate tables exist in your database

### Frontend can't connect to backend
- Verify VITE_API_URL is correct in Vercel settings
- Check browser console for CORS errors
- Backend CORS is already configured for `*.vercel.app`

### First request is slow
- Render free tier "spins down" after 15 min of inactivity
- First request takes 30-60 seconds to "wake up"
- Consider upgrading to paid tier ($7/mo) to remove cold starts

---

## What's Next?

- [ ] Update Google OAuth redirect URIs to include your Vercel URL
- [ ] Set up custom domain (optional)
- [ ] Configure error monitoring (Sentry, etc.)
- [ ] Set up CI/CD for automated testing

---

## Quick Reference

**Deployment Files Created:**
- [`render.yaml`](render.yaml) - Backend deployment config
- [`frontend/vercel.json`](frontend/vercel.json) - Frontend routing config
- [`frontend/.env.production.example`](frontend/.env.production.example) - Prod env template

**Full Documentation:**
- See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed guide

**Auto-Deploy:**
Both services auto-deploy when you push to `main` branch!

```bash
git add .
git commit -m "Your changes"
git push origin main
```

---

## URLs After Deployment

- Backend: `https://______.onrender.com`
- Frontend: `https://______.vercel.app`
- Health Check: `https://______.onrender.com/actuator/health`

---

Need help? See [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting and advanced configuration.
