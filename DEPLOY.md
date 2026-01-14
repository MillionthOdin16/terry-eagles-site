# Terry's Eagles HQ - Deployment Guide

## Quick Deploy to Coolify

1. **Push to GitHub:**
   ```bash
   cd /home/opc/clawd/terry-eagles-site
   git remote add origin https://github.com/bradley/terry-eagles-site.git
   git push -u origin main
   ```

2. **Create in Coolify:**
   - Go to https://coolify.bradarr.com
   - Click "Create New Resource"
   - Select "Static Site"
   - Configure:
     - **Git URL:** `https://github.com/bradley/terry-eagles-site`
     - **Branch:** `main`
     - **Root Directory:** `/`
     - **Build Command:** `npm run build` (or empty for static)
     - **Start Command:** `npx serve . -l 3000`
   - **Domain:** `eagles.bradarr.com`
   - Enable HTTPS

3. **Done!** 🦞

## Local Development

```bash
cd terry-eagles-site
npm install
npm run dev
```

## Features Included

✅ Live NFL Scoreboard with auto-refresh
✅ Eagles Team Dashboard (record, standing, stats)
✅ Player Roster with filtering
✅ Latest Eagles News
✅ Season Schedule with timeline
✅ NFL Standings (NFC East, NFC, AFC)
✅ Real-time countdown to next game
✅ Dark/Light theme toggle
✅ Mobile responsive
✅ Glassmorphism UI design
✅ Animated backgrounds
✅ Toast notifications
✅ Player detail modals

## APIs Used

- **ESPN API** (FREE!) - Team data, roster, stats, news, scoreboard
- No API keys required!
