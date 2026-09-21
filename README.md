# Smart Civic Issue Resolution Agent

The Smart Civic Issue Resolution Agent is an autonomous, agentic civic complaint management system designed to streamline municipal governance. It enables citizens to report civic infrastructure issues (potholes, garbage dumps, broken streetlights, water leakage, drainage overflows) with text and images, while an autonomous agent workflow classifies problems, assesses severity, assigns responsible municipal departments, monitors strict SLA countdowns, executes follow-ups and escalations, and verifies worker repairs through visual Before/After verification before closing tickets.

---

## Core Workflow

```
REPORT → UNDERSTAND → DECIDE → ACT → MONITOR → VERIFY
```

1. **REPORT**: Citizen submits complaint with description, optional image, and location coordinates or text.
2. **UNDERSTAND**: Issue intake is analyzed for classification (e.g., `POTHOLE`, `GARBAGE`, `WATER_LEAKAGE`), severity level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and responsible department.
3. **DECIDE**: Autonomous agent determines priority, SLA duration, and initial state (`ASSIGNED` / `IN_PROGRESS`).
4. **ACT**: Agent routes the ticket to the target municipal department, logs actions in an immutable audit timeline, and dispatches to field workers.
5. **MONITOR**: Autonomous SLA breach engine continuously checks open complaints; triggers automated follow-ups for medium breaches and escalations to higher officials for critical breaches.
6. **VERIFY**: Field workers submit resolution evidence (after-image); verification engine inspects the fix, either moving the ticket to `CLOSED` or `REOPENED` for rework.

---

## Main Features

- **Multimodal Civic Complaint Handling**: Citizens can report issues with detailed descriptions, photographic evidence, and geolocation.
- **AI Issue Classification**: Identifies civic problem categories (`POTHOLE`, `GARBAGE`, `STREET_LIGHT`, `WATER_LEAKAGE`, `DRAINAGE`, `OTHER`).
- **Severity & Priority Assessment**: Computes severity scores and SLA deadlines dynamically based on urgency.
- **Department Routing**: Routes complaints to responsible departments (`ROAD_DEPARTMENT`, `SOLID_WASTE_MANAGEMENT`, `WATER_SUPPLY`, `ELECTRICAL_DEPARTMENT`, `DRAINAGE_DEPARTMENT`).
- **Agentic Workflow**: Autonomous state transitions (`ANALYZING` → `ASSIGNED` → `IN_PROGRESS` → `FOLLOW_UP` → `ESCALATED` → `VERIFICATION` → `CLOSED` / `REOPENED`).
- **SLA Monitoring Engine**: Background-checkable SLA breach evaluation (`POST /api/agent/sla-check`) that triggers autonomous actions.
- **Follow-up & Escalation**: Automatic and manual triggers for progress checks and supervisor escalation.
- **Agent Action Timeline**: Granular, auditable action log capturing every agent and human action with timestamps and results.
- **Duplicate & Proximity Detection**: Detects related and potential duplicate complaints using geospatial distance and temporal clustering (`GET /api/complaints/{id}/related`).
- **Resolution Verification**: Validates resolution evidence with before/after comparison logic before final closure.
- **Admin Dashboard**: Comprehensive municipal operations dashboard with live KPI counters, department breakdown, SLA countdown timers, action history, and interactive verification studio.

---

## Technology Stack

- **Frontend (Citizen Portal)**: React 19, Vite, Lucide React, Tailwind CSS
- **Backend**: FastAPI, Uvicorn, Pydantic v2
- **Database**: SQLite with SQLAlchemy ORM
- **AI / Agent Architecture**: AI Service Adapter with structured JSON output schemas, deterministic heuristic analysis engine with hooks for Gemini LLM models (`ai_agent/`)
- **API Protocol**: RESTful JSON API with OpenAPI/Swagger documentation
- **Version Control**: Git & GitHub

---

## Getting Started & Running

### 1. Prerequisites
- Python 3.10+ (with virtual environment)
- Node.js 18+ and npm

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies (if not already installed)
pip install -r requirements.txt

# Start the FastAPI server (runs on http://127.0.0.1:8000)
uvicorn app.main:app --reload --port 8000
```

### 3. Citizen Frontend Setup
```bash
# In a separate terminal, navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server (runs on http://localhost:3000)
npm run dev
```

### 4. Municipal Admin Dashboard Setup
```bash
# In a separate terminal, serve the dashboard static files
# Windows / Linux:
python -m http.server 8080 --directory dashboard
# Open http://localhost:8080 in your browser
```

### 5. Running Tests
```bash
# Run the complete backend test suite (11 test suites covering all workflows)
cd backend
python test_api.py
```
