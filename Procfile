# Procfile for Heroku/Heroku-like Deployment (D2-18 Alternative)
# 
# Procfile tells deployment platform how to run the app.
# 
# Deploy to Heroku:
#   1. Create account at heroku.com
#   2. Install Heroku CLI
#   3. Run: heroku create reflex-backend
#   4. Run: git push heroku main
#   5. Set environment variables: heroku config:set SUPABASE_URL=... etc
#   6. View logs: heroku logs --tail
#
# Deploy to Railway.app:
#   1. Create account at railway.app
#   2. Connect GitHub
#   3. Railway auto-detects Procfile
#   4. Add environment variables in Railway dashboard
#   5. Deploy!

web: npm start
release: npm run seed || true
