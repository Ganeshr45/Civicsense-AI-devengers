# CivicSense AI

### Smart Civic Issue Detection & Resolution Platform

> **One report today. A better city tomorrow.**

CivicSense AI is a smart civic issue reporting and resolution platform that helps citizens report problems such as potholes, garbage accumulation, broken streetlights, and water leakages.

Instead of relying on manual complaint filing and triage, CivicSense automates the workflow from **report submission → AI detection → severity assessment → duplicate detection → department routing → status tracking**.

---

## 🚀 Features

### 👤 Citizen Portal

* One-tap civic issue reporting
* Image upload
* GPS-based location capture
* Issue description
* OTP-based authentication
* Personal complaint dashboard
* Real-time complaint status tracking
* Complaint detail and status timeline

### 🤖 AI-Powered Detection

CivicSense analyzes uploaded images using:

* **Gemini Vision API** when `GEMINI_API_KEY` is configured
* **OpenCV-based local heuristic classifier** as an offline fallback

Supported issue categories:

* 🕳️ Pothole
* 🗑️ Garbage
* 💡 Broken streetlight
* 💧 Water leakage
* Other

The system also generates a severity level and confidence score.

### 🔄 Duplicate Detection

CivicSense attempts to prevent duplicate complaints by comparing:

* Geographic distance
* Issue category
* Description similarity
* Reporting time window

Repeated reports can be linked to an existing complaint instead of creating unnecessary duplicate tickets.

### 🏢 Automatic Department Routing

Complaints are automatically routed according to their detected category.

Example:

```text
Pothole
   ↓
Road Department

Garbage
   ↓
Sanitation Department

Broken Streetlight
   ↓
Electrical Department

Water Leakage
   ↓
Water Department
```

### 📊 Government Dashboard

Government officers/admins can view:

* Complaint statistics
* Category breakdown
* Severity breakdown
* Priority complaints
* Complaint status
* Department information
* Average resolution time
* Complaint map

### 📍 Map Visualization

The application uses:

* **Leaflet**
* **OpenStreetMap**

for displaying civic complaints geographically without requiring a paid mapping API.

---

# 🏗️ System Architecture

```text
                 ┌─────────────────────┐
                 │      Citizen        │
                 │   React Web/PWA     │
                 └──────────┬──────────┘
                            │
                            │ REST API
                            ▼
                 ┌─────────────────────┐
                 │    FastAPI Backend  │
                 └──────────┬──────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
      Authentication   AI Detection     Duplicate Detection
       JWT + OTP       Gemini/OpenCV      Distance + Text
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │     PostgreSQL      │
                 │       / SQLite      │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Department Routing  │
                 └─────────────────────┘
```

---

# 🧠 AI Processing Pipeline

```text
Citizen uploads image
          │
          ▼
    Image validation
          │
          ▼
  Gemini Vision API
          │
          │ API unavailable /
          │ API key not configured
          ▼
 OpenCV heuristic classifier
          │
          ▼
Category + Severity + Confidence
          │
          ▼
    Duplicate Detection
          │
          ▼
    Department Routing
          │
          ▼
      Create Ticket
          │
          ▼
   Citizen Tracking
```

The current implementation intentionally provides an offline fallback, allowing the core detection workflow to operate without a paid AI API.

---

# 🛠️ Technology Stack

| Layer               | Technology                      |
| ------------------- | ------------------------------- |
| Frontend            | React 19                        |
| Build Tool          | Vite                            |
| Styling             | Tailwind CSS                    |
| Routing             | React Router                    |
| Maps                | Leaflet + OpenStreetMap         |
| Backend             | FastAPI                         |
| Language            | Python                          |
| ORM                 | SQLAlchemy                      |
| Database            | SQLite / PostgreSQL             |
| Authentication      | JWT + OTP                       |
| AI Vision           | Gemini Vision                   |
| AI Fallback         | OpenCV                          |
| Image Processing    | Pillow + OpenCV                 |
| API                 | REST                            |
| Containerization    | Docker                          |
| Local Orchestration | Docker Compose                  |
| Production Frontend | Vercel                          |
| Production Backend  | Render / similar cloud platform |

---

# 📁 Project Structure

```text
civicsense/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── auth.py
│   │   ├── seed.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── reports.py
│   │   │   └── dashboard.py
│   │   │
│   │   └── services/
│   │       ├── ai_detection.py
│   │       ├── duplicate_detection.py
│   │       └── routing.py
│   │
│   ├── tests/
│   │   └── test_api.py
│   │
│   ├── requirements.txt
│   ├── .env.example
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   └── .env.example
│
├── docker-compose.yml
└── README.md
```

---

# ⚙️ Installation

## Prerequisites

Install:

* Python 3.10+
* Node.js 18+
* npm
* Git

Docker is optional for local development.

---

# 💻 Running Locally

## 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/civicsense-ai.git
cd civicsense
```

---

## 2. Start the Backend

```bash
cd backend
```

Create a virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

### Windows

```bash
copy .env.example .env
```

### Linux / macOS

```bash
cp .env.example .env
```

Start FastAPI:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/api/health
```

Expected response:

```json
{
  "status": "ok"
}
```

---

# 🌐 Start the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```bash
copy .env.example .env
```

or:

```bash
cp .env.example .env
```

The frontend environment should contain:

```env
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🐳 Running with Docker

The project includes Docker Compose for running the complete application stack.

From the project root:

```bash
docker compose up --build
```

This starts:

```text
PostgreSQL
    +
FastAPI Backend
    +
React Frontend
```

Frontend:

```text
http://localhost
```

Backend:

```text
http://localhost:8000
```

API documentation:

```text
http://localhost:8000/docs
```

To stop the application:

```bash
docker compose down
```

---

# 🌱 Seed Demo Data

After starting the backend, demo data can be created with:

```bash
cd backend
python -m app.seed
```

The project provides demo accounts for:

| Role    | Demo Phone      |
| ------- | --------------- |
| Citizen | `+919876500010` |
| Citizen | `+919876500011` |
| Citizen | `+919876500012` |
| Citizen | `+919876500013` |
| Officer | `+919876500001` |
| Admin   | `+919876500002` |

### OTP Authentication

During development, no external SMS provider is required.

The OTP is generated and returned through the development flow instead of being sent through a real SMS gateway.

For production, integrate an SMS provider such as Twilio or MSG91.

---

# 🔐 Environment Variables

## Backend

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=sqlite:///./civicsense.db

JWT_SECRET=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

GEMINI_API_KEY=

CORS_ORIGINS=http://localhost:5173

DUPLICATE_RADIUS_METERS=100
DUPLICATE_WINDOW_HOURS=72
```

### Production Database

For PostgreSQL:

```env
DATABASE_URL=postgresql+psycopg2://USER:PASSWORD@HOST:5432/DATABASE
```

### Gemini

To enable Gemini-powered image classification:

```env
GEMINI_API_KEY=your_api_key
```

If the key is not configured, CivicSense uses the local OpenCV classifier.

---

## Frontend

Create:

```text
frontend/.env
```

```env
VITE_API_URL=http://localhost:8000
```

For production:

```env
VITE_API_URL=https://your-backend-url.onrender.com
```

---

# 🔌 API Endpoints

All API endpoints are under `/api`.

## Authentication

```text
POST /api/auth/request-otp
```

Generate a login OTP.

```text
POST /api/auth/verify-otp
```

Verify OTP and obtain a JWT.

```text
GET /api/auth/me
```

Retrieve the current authenticated user.

---

## Reports

```text
POST /api/reports
```

Submit a civic complaint.

Supports:

* Image
* Description
* Latitude
* Longitude

```text
GET /api/reports
```

Retrieve reports based on the authenticated user's role.

```text
GET /api/reports/{id}
```

Retrieve complaint details and status history.

```text
PATCH /api/reports/{id}/status
```

Update complaint status.

---

## Dashboard

```text
GET /api/dashboard/stats
```

Returns aggregate dashboard statistics.

```text
GET /api/dashboard/departments
```

Returns available departments.

---

# 🔄 Complaint Lifecycle

```text
SUBMITTED
    │
    ▼
AI ANALYSIS
    │
    ├── Category
    ├── Severity
    └── Confidence
    │
    ▼
DUPLICATE CHECK
    │
    ├── Duplicate → DUPLICATE
    │
    └── New Report
            │
            ▼
        DEPARTMENT ROUTING
            │
            ▼
          ROUTED
            │
            ▼
       IN PROGRESS
            │
            ▼
         RESOLVED
```

Possible report statuses include:

```text
submitted
duplicate
routed
in_progress
resolved
rejected
```

---

# 🧪 Testing

Run the backend tests:

```bash
cd backend
pytest tests/ -v
```

The test suite covers areas including:

* OTP authentication
* Invalid OTP rejection
* Authentication protection
* Report creation
* AI classification
* Coordinate validation
* Dashboard statistics

---

# 🚀 Production Deployment

## Architecture

```text
                 Internet
                    │
                    ▼
             ┌─────────────┐
             │   Vercel    │
             │ React / PWA │
             └──────┬──────┘
                    │
                    │ HTTPS REST API
                    ▼
             ┌─────────────┐
             │   Render    │
             │   FastAPI   │
             └──────┬──────┘
                    │
                    ▼
             ┌─────────────┐
             │ PostgreSQL  │
             │   Database  │
             └─────────────┘
```

### Backend

Deploy the `backend/` directory to Render or another Docker-compatible platform.

Set:

```env
DATABASE_URL=your-production-postgres-url
JWT_SECRET=your-production-secret
GEMINI_API_KEY=your-gemini-key
CORS_ORIGINS=https://your-frontend.vercel.app
```

Start command:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Frontend

Deploy `frontend/` to Vercel.

Set:

```env
VITE_API_URL=https://your-backend.onrender.com
```

Then rebuild and deploy.

---

# ⚠️ Production Considerations

The current project is designed as a **hackathon-scale MVP** demonstrating the complete end-to-end workflow.

Before production municipal deployment, consider:

### AI

The current implementation uses Gemini Vision or OpenCV heuristics.

A future version can replace this with a properly trained/fine-tuned YOLOv8 model using a labeled civic-issue dataset.

### Authentication

The development OTP flow does not send real SMS messages.

Production should integrate a verified SMS provider.

### File Storage

Uploaded images are currently stored under:

```text
backend/uploads
```

For production, use persistent object storage such as an S3-compatible service.

### Database

Use managed PostgreSQL rather than SQLite for production.

### Security

Production deployment should also include:

* Strong JWT secret
* HTTPS
* Secure CORS configuration
* API rate limiting
* File type validation
* File size limits
* Authentication/authorization checks
* Secure secret management
* Database backups

---

# 🔮 Future Scope

## Fine-Tuned YOLOv8

Train a dedicated civic-issue detection model using a labeled dataset.

## Voice Reporting

Allow citizens to report issues using local languages through:

```text
Voice
 ↓
Speech-to-Text
 ↓
NLP
 ↓
Issue Classification
 ↓
Department Routing
```

## WhatsApp Reporting

Allow citizens to submit civic complaints through WhatsApp.

## Smart Sensors

Integrate IoT sensors for automatic detection of:

* Water leakage
* Road conditions
* Environmental problems

## Drone Monitoring

Use drone imagery for large-scale infrastructure and road inspections.

## Citizen Rewards

Introduce a reward system for verified civic issue reporting.

---

# 📊 Impact

CivicSense aims to improve:

* Complaint processing speed
* Department routing accuracy
* Civic transparency
* Duplicate complaint handling
* Municipal response monitoring
* Citizen participation

---

# 🎯 Hackathon Pitch

> **Empowering Citizens. Enabling Smarter Cities.**

CivicSense AI bridges the gap between citizens and municipal authorities by turning a simple civic complaint into an automatically analyzed, prioritized, routed, and trackable ticket.

### One Report Today. A Better City Tomorrow.

---

# 👨‍💻 Developer

**Ganesh Rajeevkumar P C**

Full Stack Developer
Sole Architect & Developer

Built for **Hackathon 2026**.

---

## 📄 License

Add the project's chosen open-source license here before publishing the repository.

