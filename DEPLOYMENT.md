# Deployment Guide - USC RideShare

This guide will help you deploy your USC RideShare application to production using Render for the backend and Vercel for the frontend.

## Prerequisites

- GitHub account with this repository
- [Render account](https://render.com) (free tier available)
- [Vercel account](https://vercel.com) (free tier available)
- PostgreSQL database (you're already using Supabase, which is perfect!)

---

## Part 1: Deploy Backend to Render

### Step 1: Push Your Code to GitHub

Make sure your latest code is pushed to GitHub:

```bash
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

### Step 2: Create a New Web Service on Render

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select your **USCRideShare** repository
4. Render will automatically detect the `render.yaml` file

### Step 3: Configure Environment Variables

In the Render dashboard, add these environment variables:

| Variable Name | Value | Notes |
|--------------|-------|-------|
| `DATABASE_URL` | Your Supabase connection string | Format: `postgresql://user:password@host:port/database` |
| `JWT_SECRET` | A secure random string | Generate with: `openssl rand -base64 32` |
| `JWT_EXPIRATION_MS` | `86400000` | 24 hours in milliseconds |
| `SPRING_PROFILES_ACTIVE` | `prod` | Sets production mode |

#### How to Get Your Supabase DATABASE_URL:

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the **Connection String** (make sure to replace `[YOUR-PASSWORD]` with your actual password)

Example format:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will start building your application
3. Wait for the build to complete (usually 3-5 minutes)
4. Once deployed, you'll get a URL like: `https://usc-rideshare-backend.onrender.com`

### Step 5: Test Your Backend

Test the health endpoint:
```bash
curl https://your-app-name.onrender.com/actuator/health
```

You should see:
```json
{"status":"UP"}
```

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Update Frontend API URL

1. Open `frontend/.env` or create `frontend/.env.production`
2. Add your Render backend URL:

```env
VITE_API_URL=https://your-backend-url.onrender.com
# or REACT_APP_API_URL if using Create React App
```

### Step 2: Push Changes

```bash
git add .
git commit -m "Configure frontend for production"
git push origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Detect automatically (React/Vite)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (or `yarn build`)
   - **Output Directory**: `dist` (for Vite) or `build` (for CRA)

### Step 4: Add Environment Variables in Vercel

In the Vercel project settings, add:
- `VITE_API_URL` = `https://your-backend-url.onrender.com`

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for deployment (usually 1-2 minutes)
3. You'll get a URL like: `https://usc-rideshare.vercel.app`

---

## Part 3: Configure CORS

Your backend needs to allow requests from your frontend domain.

### Option 1: Check if CORS is Already Configured

Look for a CORS configuration file in your backend:
- `backend/src/main/java/com/usc/rideshare/config/WebConfig.java`
- `backend/src/main/java/com/usc/rideshare/config/CorsConfig.java`

### Option 2: Update CORS Configuration

If CORS configuration exists, add your Vercel domain:

```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/**")
            .allowedOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "https://usc-rideshare.vercel.app",  // Add your Vercel URL
                "https://*.vercel.app"                // Allow preview deployments
            )
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
}
```

Alternatively, use an environment variable:

```java
.allowedOrigins(System.getenv("ALLOWED_ORIGINS").split(","))
```

Then in Render, add environment variable:
- `ALLOWED_ORIGINS` = `http://localhost:3000,https://usc-rideshare.vercel.app`

---

## Part 4: Database Migrations

Your application uses `ddl-auto: validate`, which means Hibernate won't auto-create tables.

### Ensure Database Schema Exists

If you haven't already, you need to either:

1. **Change to `ddl-auto: update`** in production (not recommended for prod):
   ```yaml
   jpa:
     hibernate:
       ddl-auto: update
   ```

2. **Use a migration tool like Flyway or Liquibase** (recommended)

3. **Manually create tables** by temporarily setting `ddl-auto: create` locally, then exporting the schema

---

## Troubleshooting

### Backend Issues

**Issue**: Build fails on Render
- Check the build logs in Render dashboard
- Ensure `pom.xml` has all required dependencies
- Verify Java version is set to 17

**Issue**: Application starts but health check fails
- Check application logs in Render
- Verify `DATABASE_URL` is set correctly
- Check if database is accessible from Render's IP

**Issue**: Database connection errors
- Verify your Supabase connection string
- Check if you need to add Render's IP to Supabase allowed IPs (usually not needed)
- Ensure password special characters are URL-encoded

### Frontend Issues

**Issue**: API calls fail with CORS errors
- Update CORS configuration in backend
- Verify frontend is using correct backend URL
- Check browser console for specific CORS error

**Issue**: Environment variables not working
- Ensure variables start with `VITE_` (for Vite) or `REACT_APP_` (for CRA)
- Rebuild and redeploy after adding env vars
- Check Vercel environment settings

---

## Free Tier Limitations

### Render Free Tier:
- Services spin down after 15 minutes of inactivity
- First request after inactivity takes 30-60 seconds (cold start)
- 750 hours/month (enough for one service running 24/7)

### Vercel Free Tier:
- Unlimited deployments
- 100GB bandwidth/month
- No cold starts for frontend

### Recommendations:
- Consider upgrading Render for production use ($7/month removes cold starts)
- Use Vercel's free tier for frontend (no limitations for most use cases)

---

## Monitoring Your Deployment

### Backend Health Check
```bash
curl https://your-backend.onrender.com/actuator/health
```

### View Logs
- **Render**: Dashboard → Your Service → Logs tab
- **Vercel**: Dashboard → Your Project → Deployments → Click deployment → Runtime Logs

---

## Updating Your Deployment

### Backend Updates:
1. Push changes to GitHub
2. Render automatically rebuilds and deploys

### Frontend Updates:
1. Push changes to GitHub
2. Vercel automatically rebuilds and deploys

Both platforms support automatic deployments on git push!

---

## Custom Domain (Optional)

### For Backend (Render):
1. Render Dashboard → Your Service → Settings → Custom Domain
2. Add your domain and follow DNS instructions

### For Frontend (Vercel):
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain and follow DNS instructions

---

## Need Help?

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Spring Boot Deployment**: https://docs.spring.io/spring-boot/docs/current/reference/html/deployment.html

---

## Quick Reference

### Your Deployment URLs:
- Backend: `https://[your-service-name].onrender.com`
- Frontend: `https://[your-project-name].vercel.app`

### Important Files:
- [`render.yaml`](render.yaml) - Render configuration
- [`backend/pom.xml`](backend/pom.xml) - Backend dependencies
- [`backend/src/main/resources/application.yml`](backend/src/main/resources/application.yml) - Backend config

### Environment Variables Checklist:
Backend (Render):
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] JWT_EXPIRATION_MS
- [ ] SPRING_PROFILES_ACTIVE
- [ ] ALLOWED_ORIGINS (if using env var for CORS)

Frontend (Vercel):
- [ ] VITE_API_URL (or REACT_APP_API_URL)

---

Good luck with your deployment! 🚀
