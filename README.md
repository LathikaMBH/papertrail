# PaperTrail 🗺️
### Precision newspaper delivery route tracking

A full-stack PWA for managing and tracking paper delivery routes with real GPS auto-detection.

---

## Tech Stack
- **Frontend**: React 18 + Vite + Leaflet (OpenStreetMap) + Socket.io
- **Backend**: Node.js + Express + Socket.io + JWT auth
- **Database**: SQLite (file-based, no server needed)
- **Maps**: OpenStreetMap — completely free, no API key

---

## Quick Start

### 1. Clone / unzip the project
```bash
cd papertrail
```

### 2. Start the backend
```bash
cd backend
npm install
npm start
# → Runs on http://localhost:4000
```

### 3. Start the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
# → Runs on http://localhost:3000
```

### 4. Open the app
Visit **http://localhost:3000** in your browser (or on your phone on the same Wi-Fi).

---

## Default Login
| Role   | Email                    | Password   |
|--------|--------------------------|------------|
| Master | admin@papertrail.com     | admin123   |

---

## Features

### Master (Admin)
- **Dashboard** — live stats (Not started / Ongoing / Completed)
- **Create Route** — walk the route with your phone, tap "Save GPS Location" at each mailbox/building
  - Tap directly on the map OR press the GPS button while standing at the stop
  - Toggle each stop as **Mailbox** (auto-detect) or **Apartment** (manual tap)
- **Edit / Delete routes**
- **Assign routes to riders**
- **Manage rider accounts** — create usernames and passwords for your team
- **Real-time updates** — see route status change live as riders work

### Rider
- **Dashboard** — see assigned routes, progress, start button
- **Navigation** — real OpenStreetMap with:
  - 📬 **Mailboxes**: auto-marked delivered when GPS comes within **20 metres**
  - 🏢 **Apartments**: app pauses, shows large amber **Delivered** button
  - Live blue rider dot moving on the map
  - Green trail shows completed path
  - Toast notifications for each delivery

---

## How GPS Auto-Detection Works

```
Every 2 seconds:
  rider GPS position → haversine distance → next undelivered stop
  
  if stop.type === 'mailbox' AND distance < 20m:
    → auto mark delivered (no tap needed)
    → green check on map
    → advance to next stop
    
  if stop.type === 'apartment' AND distance < 20m:
    → pause GPS movement detection
    → show Delivered button
    → rider goes inside, taps button
    → resume tracking
```

---

## Deploy to Production

### Backend (e.g. Railway, Fly.io, VPS)
```bash
cd backend
# Set environment variable:
JWT_SECRET=your_random_secret_here
PORT=4000
npm start
```

### Frontend (e.g. Netlify, Vercel)
```bash
cd frontend
# Update vite.config.js proxy to point to your backend URL
npm run build
# Deploy the dist/ folder
```

### HTTPS Note
GPS `watchPosition` requires HTTPS in production. Both Railway and Netlify provide free SSL certificates.

---

## Database
SQLite database file is created automatically at `backend/papertrail.db` on first run. No setup needed.

To reset: delete `papertrail.db` and restart the backend.

---

## Project Structure
```
papertrail/
├── backend/
│   ├── server.js          # Express + Socket.io entry
│   ├── database.js        # SQLite schema + queries + seed
│   ├── middleware/auth.js # JWT verification
│   └── routes/
│       ├── auth.js        # Login / register
│       ├── routes.js      # Route CRUD + stop creation
│       ├── stops.js       # Stop update / delete
│       ├── users.js       # Rider management
│       └── delivery.js    # Start, deliver stop, end, GPS ping
└── frontend/
    ├── src/
    │   ├── pages/master/  # Dashboard, Routes, CreateRoute, Users
    │   ├── pages/rider/   # Dashboard, Navigate (main GPS screen)
    │   ├── context/       # Auth + Socket providers
    │   └── services/      # api.js + gps.js (haversine)
    └── vite.config.js     # PWA config + dev proxy
```

---

Built with ❤️ for PaperTrail · OpenStreetMap contributors
