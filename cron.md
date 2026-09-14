    ## Option 3: Vercel Cron (if deployed on Vercel)
     ## Add to vercel.json:

     { "crons": [{ "path": "/api/error-logs/cleanup", "schedule": "0 2 * * *" }] }

     Then set CRON_SECRET in Vercel project settings.