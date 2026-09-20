# Smart Civic Issue Resolution Agent — Backend

Backend and Agentic Workflow orchestration engine for PRARAMBHA 2.0 Hackathon (Problem Statement: PS01).

## Architecture

```text
Citizen Frontend
        ↓
   Backend API (FastAPI)
        ↓
   AI / Agent Brain (ai-agent/)
        ↓
   Agentic Workflow (Audit / SLA / Escalation)
        ↓
   SQLite Database (SQLAlchemy)
        ↓
   Admin Dashboard & Worker Resolution
```

---

## 1. Setup & Installation

### Prerequisites
- Python 3.10+ (tested on Python 3.14)

### Virtual Environment Setup
From the `backend/` directory:

```bash
# Create virtual environment
python -m venv venv

# Activate on Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Activate on Windows (CMD):
.\venv\Scripts\activate.bat

# Activate on Linux/macOS:
source venv/bin/activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 2. Starting the Server

From the `backend/` directory:

```bash
uvicorn app.main:app --reload --port 8000
```

The server will start at:
- **Base URL**: `http://localhost:8000`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **OpenAPI Schema**: `http://localhost:8000/openapi.json`
- **Alternative Docs (ReDoc)**: `http://localhost:8000/redoc`

The SQLite database (`civic_issues.db`) is automatically initialized on application startup.

---

---

## 3. Implemented API Endpoints (Milestones 1 & 2)

### Complaints & Lifecycle
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/complaints` | Create a complaint and record initial `COMPLAINT_RECEIVED` agent action |
| `GET` | `/api/complaints` | List complaints with optional `status`, `department`, `severity` filters |
| `GET` | `/api/complaints/{id}` | Retrieve details for a single complaint |
| `PATCH` | `/api/complaints/{id}/status` | Update lifecycle status (e.g. `ASSIGNED`, `IN_PROGRESS`, `ESCALATED`) |
| `POST` | `/api/complaints/{id}/resolve` | Worker submits resolution proof -> transitions to `VERIFICATION` |
| `POST` | `/api/complaints/{id}/verify` | AI Before/After verification -> transitions to `CLOSED` (pass) or `REOPENED` (fail) |

### Agentic Workflow & Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/agent/actions/{id}` | Retrieve chronological agent action audit trail for a complaint |
| `GET` | `/api/admin/stats` | Aggregated complaint counts by status for Admin Dashboard |
| `POST` | `/api/agent/sla-check` | Autonomous SLA engine checking deadlines, triggering `FOLLOW_UP` or `ESCALATE` |
| `POST` | `/api/agent/follow-up/{id}` | Trigger follow-up reminder for an overdue/unresolved complaint |
| `POST` | `/api/agent/escalate/{id}` | Trigger escalation to higher authority for an unresolved complaint |
| `POST` | `/api/ai/analyze` | Adapter endpoint connecting backend to AI Agent Brain stub |

---

## 4. Agentic Workflow Lifecycle

```text
NEW / ANALYZING
      ↓
   ASSIGNED
      ↓
  IN_PROGRESS ──(SLA deadline exceeded)──> SLA_BREACH / FOLLOW_UP
      │                                            │
      │                                            ↓ (Critical priority or repeated breach)
      │                                        ESCALATED
      ↓
  VERIFICATION <──(Worker submits resolution: POST /resolve)
      │
      ├──(AI verification PASSED: POST /verify)──> CLOSED
      └──(AI verification FAILED: POST /verify)──> REOPENED
```

Every single state change, SLA check, and AI verification decision is automatically written to the `agent_actions` audit log in SQLite.

---

## 5. Example API Usage

### Create a Complaint
```bash
curl -X POST "http://localhost:8000/api/complaints" \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Large pothole near the main road causing severe traffic hazard",
       "image_url": "uploads/pothole.jpg",
       "latitude": 16.7050,
       "longitude": 74.2433,
       "location_text": "Main road near central bus stand",
       "citizen_id": "CIT001"
     }'
```

### Run Autonomous SLA Monitor Check
```bash
curl -X POST "http://localhost:8000/api/agent/sla-check"
```

### Worker Submits Resolution
```bash
curl -X POST "http://localhost:8000/api/complaints/CMP001/resolve" \
     -H "Content-Type: application/json" \
     -d '{
       "resolution_description": "Asphalt resurfacing and steam roller compaction completed",
       "after_image_url": "uploads/pothole_fixed.jpg"
     }'
```

### AI Verification Check
```bash
curl -X POST "http://localhost:8000/api/complaints/CMP001/verify" \
     -H "Content-Type: application/json" \
     -d '{
       "after_image_url": "uploads/pothole_fixed.jpg"
     }'
```

### View Agent Audit Trail
```bash
curl -X GET "http://localhost:8000/api/agent/actions/CMP001"
```

---

## 6. Development Principles & Rules
- **Contract Adherence**: Field names and endpoint signatures strictly follow `docs/API_CONTRACT.md` and `docs/DATABASE_SCHEMA.md`.
- **Honest AI Integration**: AI fields remain `null` at intake until Faik's AI Agent Brain runs. Verification is handled via a clean, separated adapter.
- **Traceability & Auditability**: Every agent action across PERCEIVE → REASON → DECIDE → ACT → OBSERVE → FOLLOW UP → ESCALATE → VERIFY is recorded in `agent_actions`.
