# PaperTrail 🗺️
### GPS-Powered Delivery Route Tracking Platform

[![Live App](https://img.shields.io/badge/Live%20App-papertrail--rauma.netlify.app-7C5CEA?style=flat-square)](https://papertrail-rauma.netlify.app)
[![Backend](https://img.shields.io/badge/Backend-Railway-0B0D0E?style=flat-square)](https://papertrail-production-3f35.up.railway.app/api/health)
[![License](https://img.shields.io/badge/License-Private-red?style=flat-square)]()

PaperTrail is a full-stack Progressive Web App (PWA) for managing and tracking newspaper and parcel delivery routes. It uses real GPS auto-detection so riders are tracked automatically — no manual tapping required.

> **Built with Claude AI** — This product was designed and developed using Claude AI (Anthropic) as an AI pair-programmer, from architecture and database design through to production deployment.

---

## 🌐 Live URLs

| Service | URL |
|---|---|
| **Frontend (Netlify)** | https://papertrail-rauma.netlify.app |
| **Backend API (Railway)** | https://papertrail-production-3f35.up.railway.app |
| **Health check** | https://papertrail-production-3f35.up.railway.app/api/health |
| **GitHub repo** | https://github.com/LathikaMBH/papertrail |

---

## 👥 User Roles

PaperTrail has three distinct user roles:

### 👑 Admin
- Creates and manages Route Owner accounts (name, city, phone, email, password)
- Views all route owners, their riders, routes and delivery stats
- Full system visibility

### 🗺️ Route Owner
- Creates delivery routes by walking the route and pinning GPS coordinates on a map
- Configures each stop as **Mailbox** (auto-detected) or **Apartment** (manual tap)
- Creates up to **5 rider accounts**
- Assigns routes to riders
- Monitors live delivery progress and completion

### 🚲 Rider
- Sees only their assigned routes
- Starts a route — GPS tracking begins automatically
- **Mailbox stops** → auto-marked delivered when within 20 metres (no tapping)
- **Apartment stops** → app pauses and shows a Delivered button
- Can **Pause** (GPS stops) and **Restart** (GPS resumes) at any time
- Route auto-completes when all stops are done

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router, Leaflet / OpenStreetMap |
| **Real-time** | Socket.io (WebSockets) |
| **Backend** | Node.js, Express.js |
| **Database** | PostgreSQL (Railway managed) |
| **Auth** | JWT (JSON Web Tokens) |
| **Maps** | OpenStreetMap — free, no API key needed |
| **GPS** | Browser Geolocation API + Haversine formula |
| **Deployment** | Railway (backend + DB) · Netlify (frontend) |
| **PWA** | Installable on iOS and Android from the browser |

---

## 📁 Project Structure

```
papertrail/
├── backend/
│   ├── server.js              # Express + Socket.io entry point
│   ├── database.js            # PostgreSQL connection + schema + queries
│   ├── middleware/
│   │   └── auth.js            # JWT verification + role guards
│   └── routes/
│       ├── auth.js            # POST /api/auth/login
│       ├── users.js           # Owner + rider management
│       ├── routes.js          # Route CRUD + stop creation
│       ├── stops.js           # Stop update / delete
│       └── delivery.js        # Start, pause, resume, deliver, end, GPS ping
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/         # Admin dashboard, owners list, all routes
│   │   │   ├── owner/         # Owner dashboard, routes, riders, create route
│   │   │   └── rider/         # Rider dashboard, GPS navigation screen
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # Login state + JWT storage
│   │   │   └── SocketContext.jsx  # Socket.io real-time connection
│   │   ├── services/
│   │   │   ├── api.js         # All HTTP calls to backend
│   │   │   └── gps.js         # Haversine distance calculation
│   │   └── index.css          # Purple design system
│   ├── .env.production        # VITE_API_URL for production build
│   └── vite.config.js         # Dev server + proxy config
└── README.md
```

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js v18+ 
- Git
- PostgreSQL (local) OR use Railway DB directly

### Step 1 — Clone the repo

```bash
git clone https://github.com/LathikaMBH/papertrail.git
cd papertrail
```

### Step 2 — Backend setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
# For local PostgreSQL
PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=papertrail
PG_USER=postgres
PG_PASSWORD=your_password_here

# OR use Railway DB directly (ask team lead for the URL)
# DATABASE_URL=postgresql://...

JWT_SECRET=your_random_secret_here
PORT=4000
NODE_ENV=development
```

Start the backend:
```bash
npm start
```

You should see:
```
✅ Database schema ready
✅ Seed: admin@papertrail.com / admin123
🚀 PaperTrail backend running on http://localhost:4000
```

### Step 3 — Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open: **http://localhost:3000**

### Step 4 — Login with default credentials

```
Email:    admin@papertrail.com
Password: admin123
```

---

## 🔑 API Reference

### Authentication
```
POST /api/auth/login          { email, password } → { token, user }
```

### Users (Admin only)
```
GET    /api/users/owners           Get all route owners
POST   /api/users/owners           Create route owner
PUT    /api/users/owners/:id       Update owner (incl. password)
DELETE /api/users/owners/:id       Delete owner
GET    /api/users/owners/:id/riders  Get riders for an owner
GET    /api/users/riders           Get riders (own riders for owner)
POST   /api/users/riders           Create rider (max 5 per owner)
DELETE /api/users/riders/:id       Delete rider
```

### Routes
```
GET    /api/routes             Get routes (filtered by role)
GET    /api/routes/:id         Get route with stops
POST   /api/routes             Create route
PUT    /api/routes/:id         Update route name / assign rider
DELETE /api/routes/:id         Delete route + stops
POST   /api/routes/:id/assign  Assign rider { rider_id }
GET    /api/routes/:id/stops   Get stops for route
POST   /api/routes/:id/stops   Add stop { lat, lng, address, type }
```

### Stops
```
PUT    /api/stops/:id          Update stop details / type
DELETE /api/stops/:id          Delete stop
```

### Delivery
```
POST   /api/delivery/start/:routeId    Start route (resets stops)
POST   /api/delivery/pause/:routeId    Pause route
POST   /api/delivery/resume/:routeId   Resume route
POST   /api/delivery/stop/:stopId      Mark stop delivered { method: 'auto'|'manual' }
POST   /api/delivery/end/:routeId      Force end route
POST   /api/delivery/ping              GPS ping { routeId, lat, lng }
GET    /api/health                     Health check
```

---

## 🔌 Real-time Events (Socket.io)

Clients join a room per route: `socket.emit('join:route', routeId)`

| Event | Direction | Payload |
|---|---|---|
| `route:started` | Server → Client | `{ routeId, riderId, riderName }` |
| `route:paused` | Server → Client | `{ routeId, riderId }` |
| `route:resumed` | Server → Client | `{ routeId, riderId }` |
| `route:completed` | Server → Client | `{ routeId }` |
| `stop:delivered` | Server → Client | `{ stopId, routeId, method, riderId }` |
| `rider:location` | Server → Client | `{ routeId, riderId, lat, lng }` |

---

## 🗄️ Database Schema

```sql
users (id, name, email, password_hash, role, city, phone, owner_id, created_at)
  role: 'admin' | 'route_owner' | 'rider'
  owner_id: FK → users.id (riders belong to a route_owner)

routes (id, name, status, owner_id, rider_id, started_at, paused_at, completed_at, created_at)
  status: 'not_started' | 'ongoing' | 'paused' | 'completed'

stops (id, route_id, order_num, address, lat, lng, type, delivered, delivered_at, delivered_method, created_at)
  type: 'mailbox' | 'apartment'
  delivered_method: 'auto' | 'manual'

location_pings (id, route_id, rider_id, lat, lng, recorded_at)
```

---

## 🚀 Deployment

### Backend — Railway
1. Connect the GitHub repo to Railway
2. Set **Root Directory** → `backend`
3. Add environment variables:
   ```
   DATABASE_URL = (Railway PostgreSQL reference)
   JWT_SECRET   = your_secret_here
   NODE_ENV     = production
   PORT         = 4000
   ```
4. Railway auto-deploys on every `git push` to `main`

### Frontend — Netlify
1. Build locally: `npm run build` (inside `frontend/`)
2. Ensure `frontend/.env.production` contains:
   ```
   VITE_API_URL=https://papertrail-production-3f35.up.railway.app
   ```
3. Drag the `frontend/dist/` folder to Netlify dashboard
4. The `dist/_redirects` file handles React Router (SPA routing)

---

## 🌿 Git Workflow (for developers)

**Never commit directly to `main`.** Use feature branches:

```bash
# Start new work
git checkout -b feature/your-feature-name

# Make changes, then commit
git add .
git commit -m "Description of what you changed"

# Push your branch
git push origin feature/your-feature-name

# Open a Pull Request on GitHub for review
```

### Branch naming
```
feature/add-notification-system
fix/gps-accuracy-issue
improvement/rider-dashboard-ui
```

---

## ⚠️ Important Rules

1. **Never commit `.env` files** — they contain secrets
2. **Never commit `node_modules/`** — too large, use `npm install`
3. **Never commit `frontend/dist/`** — build artifacts
4. **Always test locally** before pushing
5. **Ask before changing** the database schema — coordinate with the team

---

## 🐛 Common Issues

| Problem | Fix |
|---|---|
| `vite is not recognized` | Run `npm install` in the frontend folder |
| `Cannot connect to database` | Check your `.env` file has correct PostgreSQL credentials |
| `Login failed` on production | Check `VITE_API_URL` in `.env.production` has `https://` |
| Blank page after login | Clear localStorage: `localStorage.clear()` in browser console |
| GPS not working | Must be on HTTPS in production. Use localhost for local dev |

---

## 📞 Contact

**Project Owner:** Lathika Herath  
**Email:** lathika.mbh@gmail.com  
**Location:** Rauma, Finland

---

*PaperTrail — Precision delivery, every street* 🗺️
