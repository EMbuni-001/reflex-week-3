# Backend Deployment Guide (D2-18)

## Overview

The backend can be deployed to multiple platforms. Choose based on your preferences:

- **Render** (recommended) — Free tier available, auto-deploys from GitHub
- **Railway** — Alternative free tier option
- **Heroku** — Traditional option (paid tier now required)
- **AWS / Google Cloud** — Enterprise option

---

## Pre-Deployment Checklist

- [ ] All code committed to GitHub
- [ ] Environment variables prepared (see below)
- [ ] Database migrations applied
- [ ] Tests passing locally (`npm test`)
- [ ] Seed data ready (`npm run seed`)

---

## Environment Variables Required

### Backend Requires:

```bash
# Supabase Configuration (CRITICAL)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Frontend Requires:

```bash
# In client/.env
VITE_API_BASE_URL=https://reflex-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Deploy to Render (Recommended)

### Step 1: Create Render Account
- Go to [render.com](https://render.com)
- Sign up / Sign in
- Connect GitHub account

### Step 2: Create Web Service
1. Click "New +" > Web Service
2. Select this GitHub repository
3. Choose branch: `main`
4. Build command: `npm install`
5. Start command: `npm start`
6. Environment: Node
7. Region: oregon (or closest to your users)
8. Plan: Free (upgrade to paid for production)

### Step 3: Add Environment Variables
1. Click on service after creation
2. Go to "Environment" tab
3. Add each variable from "Environment Variables Required" section above

### Step 4: Deploy
- Click "Deploy"
- View logs in "Logs" tab
- Access your API at: `https://reflex-backend.onrender.com/api/health`

### Step 5: Configure Frontend
Update `client/.env`:
```bash
VITE_API_BASE_URL=https://reflex-backend.onrender.com
```

### Auto-Deploy on Push
Render automatically deploys when you push to main branch. Disable in settings if needed.

### Render Free Tier Limitations
- App spins down after 15 minutes of inactivity (cold start: ~30 seconds)
- Limited to 0.5 GB RAM
- Upgrade to "Pay as You Go" for production use

---

## Deploy to Railway (Alternative)

### Step 1: Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign up with GitHub

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose this repository
4. Railway auto-detects `railway.json`

### Step 3: Add Environment Variables
1. In project settings, add each variable from above
2. Railway secures secrets automatically

### Step 4: Deploy
- Railway auto-deploys on push to main branch
- View logs in "Deployments" tab
- Access your API at the Railway URL

### Railway Free Tier
- $5 credit monthly
- More generous than Render
- Apps don't auto-sleep

---

## Deploy to Heroku (Legacy)

### Prerequisites
- Heroku account: [heroku.com](https://heroku.com)
- Heroku CLI installed: `brew install heroku`

### Step 1: Login to Heroku
```bash
heroku login
```

### Step 2: Create App
```bash
heroku create reflex-backend
```

### Step 3: Set Environment Variables
```bash
heroku config:set SUPABASE_URL=your-url
heroku config:set SUPABASE_SERVICE_ROLE_KEY=your-key
heroku config:set NODE_ENV=production
```

### Step 4: Deploy
```bash
git push heroku main
```

### Step 5: View Logs
```bash
heroku logs --tail
```

### Heroku Free Tier (Deprecated)
- Free tier no longer available
- Minimum paid tier: $7/month
- Recommend Render/Railway instead

---

## Post-Deployment Steps

### 1. Verify Health Check
```bash
curl https://your-deployed-url/api/health
# Expected response: { "status": "ok" }
```

### 2. Test Authentication
```bash
curl -X POST https://your-deployed-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "retailer@demo.com", "password": "RetailerDemo123!"}'
```

### 3. Seed Demo Data (Optional)
If configured in deployment:
```bash
npm run seed
```

Or manually via Supabase dashboard.

### 4. Test Real Endpoints
```bash
# Get bearerToken from login response above
export TOKEN="your_token_here"

curl https://your-deployed-url/api/deliveries \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common Issues & Fixes

### "Cannot find module 'dotenv'"
**Fix:** Ensure `npm install` runs during build
```bash
# Render: Check "Build Command" is "npm install"
# Railway: Should auto-detect
```

### "SUPABASE_URL is not defined"
**Fix:** Add to platform environment variables (not hardcoded)
- Render: Environment tab > add variable
- Railway: Settings > add variable

### "Cold Start Taking Too Long"
**Solution:**
- Render free tier: Upgrade to paid plan
- Railway: No cold starts on free tier
- Alternative: Set up uptime monitoring to ping `/api/health` every 5 minutes

### "502 Bad Gateway"
**Diagnosis:**
1. Check logs: `heroku logs --tail` or platform dashboard
2. Verify SUPABASE_URL and SERVICE_ROLE_KEY are correct
3. Restart service: Platform dashboard > Restart or `heroku restart`

### "Database Connection Refused"
**Fix:**
1. Verify SUPABASE_URL is correct (including https://)
2. Verify SUPABASE_SERVICE_ROLE_KEY is not rotated
3. Check Supabase project is active (Dashboard > Project Settings)

---

## Monitoring & Maintenance

### View Logs
- **Render:** Dashboard > Logs tab
- **Railway:** Deployments > select deployment > Logs
- **Heroku:** `heroku logs --tail`

### Set Up Alerts
- **Render:** Settings > Notifications
- **Railway:** Integrations > Slack/Email
- **Heroku:** Settings > Alerts

### Update Code
1. Push to main branch: `git push origin main`
2. Platform auto-deploys (takes ~2-5 minutes)
3. Verify with health check: `curl https://your-url/api/health`

### Database Backups
- Supabase: Automatic daily backups (Dashboard > Backups)
- Enable point-in-time recovery for production

---

## Continuous Deployment with GitHub Actions

We've included `.github/workflows/deploy.yml` for automated deployment.

### Setup:
1. Get Render Deploy Hook:
   - Render Dashboard > Settings > Deploy Hook
   - Copy the URL

2. Add GitHub Secret:
   - Repository > Settings > Secrets > New repository secret
   - Name: `RENDER_DEPLOY_HOOK`
   - Value: Paste the URL

3. On every push to `main`, deployment auto-triggers

### View Status:
- GitHub > Actions tab
- Click latest workflow run
- See deployment status and logs

---

## Scaling Considerations

### When to Upgrade
- **Render Free → Starter:** If app is frequently cold-starting
- **Railway → Growth:** When exceeding $5 monthly free credits
- **All:** If concurrent users exceed 100+

### Scaling Options
1. Upgrade instance size (vertical scaling)
2. Enable autoscaling on paid plans (horizontal scaling)
3. Add Redis cache for frequently accessed data
4. Optimize database queries with indexes

---

## Rollback Procedure

### If Deployment Breaks
**Render:**
1. Dashboard > Deployments
2. Find previous successful deployment
3. Click "Re-deploy"

**Railway:**
1. Deployments tab
2. Select previous stable version
3. Click "Rollback"

**Heroku:**
```bash
heroku releases
heroku rollback v2  # Version number from releases list
```

### Prevention
- Always test locally: `npm start`
- Run tests before pushing: `npm test`
- Use feature branches; merge only tested code to main

---

## Security Best Practices

### Secrets Management
- ✅ Environment variables via platform dashboard (never in code)
- ❌ Don't commit .env files to GitHub
- ❌ Don't paste secrets in logs/issues

### HTTPS
- ✅ All platforms provide free HTTPS (auto-configured)
- ✅ Certificate auto-renews

### Service-Role Key
- ✅ Backend only (never send to frontend)
- ✅ Use VITE_SUPABASE_ANON_KEY for frontend (read-only)
- 🔄 Rotate keys quarterly via Supabase dashboard

### Monitoring
- Enable request logging
- Monitor error rates
- Set up rate limiting (add to later)

---

## Cost Comparison (2024)

| Platform | Free Tier | After Free | Best For |
|----------|-----------|-----------|----------|
| **Render** | Free up to 750 hrs/mo | $7/mo (pay-as-you-go) | Quick prototyping |
| **Railway** | $5 credit/mo | Pay overage only | Hobby projects |
| **Heroku** | ❌ Deprecated | $7/mo minimum | Enterprise teams |
| **AWS/GCP** | Various free tiers | Highly variable | Large scale |

---

## Next Steps

1. ✅ Create account on Render/Railway
2. ✅ Deploy backend
3. ✅ Get backend URL (e.g., `https://reflex-backend.onrender.com`)
4. ✅ Configure frontend VITE_API_BASE_URL
5. ✅ Deploy frontend
6. ✅ Test full workflow end-to-end

---

## Support

- **Render Docs:** https://render.com/docs
- **Railway Docs:** https://docs.railway.app
- **Heroku Docs:** https://devcenter.heroku.com
- **Supabase Docs:** https://supabase.com/docs

---

**Questions?** Check platform-specific logs and error messages first — they usually point to the exact issue.
