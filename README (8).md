# CivicSense AI

**Smart Civic Issue Detection & Resolution Platform**
*"Empowering Citizens. Enabling Smarter Cities."*

A citizen reports a civic issue — a pothole, garbage pile, broken streetlight, or water
leak — with a single photo. AI classifies the category and severity, checks for duplicates,
routes it to the right municipal department, and keeps the citizen updated until it's
resolved.

---

## Problem

Municipal issue reporting is broken in five specific ways: manual, error-prone filing;
duplicate/unorganized tickets; misrouting to the wrong department; slow resolution
(14+ day average); and zero transparency for the citizen after they file a report.

## Solution

CivicSense AI automates everything after submission — detection, severity scoring,
duplicate matching, and department routing — removing the manual triage bottleneck
entirely. One photo in, a tracked and routed ticket out.

## Features

- **One-tap reporting** — photo + GPS location, no forms
- **AI image classification** — category (pothole / garbage / streetlight / water leak)
  and severity, via Gemini Vision when configured, or a fully offline OpenCV heuristic
  classifier with zero paid APIs
- **Duplicate detection** — geospatial (haversine) + text-similarity matching folds
  repeat reports into the original ticket instead of creating noise
- **Auto-routing** — tickets are dispatched straight to the responsible department
- **Live tracking** — citizens see a timeline from submission to resolution
- **Government dashboard** — map view, category/severity breakdowns, priority queue,
  average resolution time

---

## Architecture

```
Citizen (React PWA)                  Officer / Admin (React)
        │                                     │
        └───────────────┬─────────────────────┘
                         ▼
                  FastAPI Backend
        ┌──────────────┼───────────────┐
        ▼               ▼               ▼
   Auth (JWT/OTP)   AI Detection    Duplicate + Routing
                    (Gemini or       (haversine distance +
                     OpenCV          text similarity)
                     heuristic)
                         │
                         ▼
                  PostgreSQL / SQLite
                  (reports, users, departments, status timeline)
```

**AI pipeline:**

```
Photo upload
    │
    ▼
Gemini Vision API (if GEMINI_API_KEY set)
    │  on failure or if unset
    ▼
Local OpenCV heuristic classifier
(edge density, color histograms → category + severity)
    │
    ▼
Duplicate check (same category, within radius + time window)
    │
    ▼
Department routing → ticket created → citizen notified
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | Fast dev loop, small bundle, no paid tooling |
| Backend | FastAPI (Python) | Async REST, automatic OpenAPI docs, fast to build |
| Database | PostgreSQL (prod) / SQLite (local dev, zero setup) | Real relational + geospatial-capable data, but runs with no external service needed for local dev |
| AI — vision | Gemini 1.5 Flash (optional) + OpenCV heuristic fallback | Real functionality with zero required paid API; swappable for a fine-tuned YOLOv8 model once a labeled dataset exists |
| Maps | Leaflet + OpenStreetMap | Free, no API key required |
| Auth | JWT + phone OTP (console-logged in dev) | Real generate/store/verify flow; swap in Twilio/MSG91 for production SMS |
| Deployment | Docker Compose (local) / Vercel + Render + managed Postgres (production) | Free-tier friendly |

---

## Project Structure

```
civicsense/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, CORS, static uploads
│   │   ├── config.py          # env-based settings
│   │   ├── database.py        # SQLAlchemy engine/session
│   │   ├── models.py          # User, Report, Department, StatusUpdate, OTP
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── auth.py            # JWT + OTP helpers
│   │   ├── seed.py            # demo data
│   │   ├── routers/
│   │   │   ├── auth.py        # /api/auth/*
│   │   │   ├── reports.py     # /api/reports/*
│   │   │   └── dashboard.py   # /api/dashboard/*
│   │   └── services/
│   │       ├── ai_detection.py       # Gemini + OpenCV classifier
│   │       ├── duplicate_detection.py # haversine + text similarity
│   │       └── routing.py             # category → department
│   ├── tests/test_api.py
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/       (Landing, Login, CitizenDashboard, ReportForm, ReportDetail, GovDashboard)
│   │   ├── components/  (NavBar, StatusBadge, SeverityBadge)
│   │   ├── context/AuthContext.jsx
│   │   └── api/client.js
│   ├── .env.example
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## Running Locally (no Docker)

### Backend

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m app.seed              # optional: load demo data
uvicorn app.main:app --reload --port 8000
```

Defaults to a local SQLite file (`civicsense.db`) — no database install required.
API docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

### Demo accounts (after seeding)

| Role | Phone |
|---|---|
| Citizen | `+919876500010` – `+919876500013` |
| Officer | `+919876500001` |
| Admin | `+919876500002` |

Login is OTP-based; since no SMS gateway is configured, the OTP is returned directly
in the API response and shown on-screen for the demo.

---

## Running with Docker

```bash
docker compose up --build
```

This starts Postgres, the backend (auto-creates tables on boot), and the frontend
behind nginx. Seed demo data with:

```bash
docker compose exec backend python -m app.seed
```

Frontend: `http://localhost` · Backend: `http://localhost:8000`

---

## Environment Variables

**backend/.env** (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | SQLite by default; set to a Postgres URL for production |
| `JWT_SECRET` | Sign/verify auth tokens — set a long random value in production |
| `GEMINI_API_KEY` | Optional. Enables Gemini Vision classification; omit to use the free local OpenCV fallback |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins |
| `DUPLICATE_RADIUS_METERS` / `DUPLICATE_WINDOW_HOURS` | Tuning for duplicate detection |

**frontend/.env**:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend base URL |

---

## API Overview

All endpoints under `/api`. Full interactive docs at `/docs` (Swagger) once running.

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/request-otp` | POST | Generate a login OTP for a phone number |
| `/api/auth/verify-otp` | POST | Verify OTP, returns JWT + user |
| `/api/auth/me` | GET | Current user |
| `/api/reports` | POST | Submit a report (multipart: image + form fields) |
| `/api/reports` | GET | List reports (citizen: own; officer: department's; admin: all) |
| `/api/reports/{id}` | GET | Report detail + status timeline |
| `/api/reports/{id}/status` | PATCH | Officer/admin updates status |
| `/api/dashboard/stats` | GET | Aggregate counts, resolution time, breakdowns |
| `/api/dashboard/departments` | GET | Department list |

---

## Testing

```bash
cd backend
pytest tests/ -v
```

Covers: OTP auth flow (including invalid-code rejection), unauthenticated access
rejection, report creation with AI classification, coordinate validation, and
dashboard stats.

---

## Deployment (Production)

1. **Database**: provision managed Postgres (Neon / Supabase / Render Postgres).
   Set `DATABASE_URL` on the backend accordingly.
2. **Backend**: deploy `backend/` to Render/Railway/Fly.io using the included
   `Dockerfile`, or `pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
   Set all env vars from `.env.example`.
3. **Frontend**: deploy `frontend/` to Vercel — set `VITE_API_URL` to the deployed
   backend URL as a build-time env var.
4. **CORS**: set `CORS_ORIGINS` on the backend to the deployed frontend domain.
5. **File storage**: uploaded images are written to `backend/uploads` — mount a
   persistent volume (Docker) or swap in S3-compatible storage for a stateless
   deployment.

---

## Known Limitations / Honest Scope

This is a hackathon-scale MVP, built to demonstrate the full pipeline working
end-to-end rather than to be production-hardened:

- The vision classifier ships with a real, functioning OpenCV heuristic (color/edge
  analysis) rather than a YOLOv8 model fine-tuned on labeled civic-issue photos —
  no such dataset was available. The `ai_detection.py` interface is designed so a
  fine-tuned YOLOv8 model can be dropped in later without touching calling code.
- OTP delivery is logged server-side and echoed in the API response instead of sent
  by SMS, since no paid SMS gateway is wired up. The generate/store/verify logic
  itself is fully real.
- Voice input, WhatsApp bot, and IoT/drone integration (mentioned in the original
  pitch deck as future scope) are not implemented in this MVP.

## Future Scope

- Fine-tuned YOLOv8 model once a labeled civic-issue image dataset is available
- Voice input with speech-to-text + NLP summarization
- SMS OTP delivery via Twilio/MSG91
- WhatsApp Business API reporting channel
- Citizen reward/gamification system
- IoT sensor integration for water-leak alerts

---

## Hackathon Pitch

**One report today. A better city tomorrow.**
CivicSense AI bridges the gap between citizens and municipal authorities with
computer vision and real-time analytics.

*Presenter: Ganesh Rajeevkumar P C — Hackathon Pitch 2026*
