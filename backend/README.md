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

## 3. Implemented API Endpoints (Milestone 1)

### Complaints
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/complaints` | Create a complaint and record initial `COMPLAINT_RECEIVED` agent action |
| `GET` | `/api/complaints` | List complaints with optional `status`, `department`, `severity` filters |
| `GET` | `/api/complaints/{id}` | Retrieve details for a single complaint |
| `POST` | `/api/complaints/{id}/resolve` | *[Scaffold]* Worker resolution submission |
| `POST` | `/api/complaints/{id}/verify` | *[Scaffold]* AI resolution verification |

### Agent & Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/agent/actions/{id}` | Retrieve chronological agent action audit trail |
| `GET` | `/api/admin/stats` | Aggregated complaint counts by status |
| `POST` | `/api/agent/sla-check` | *[Scaffold]* Periodic SLA monitor check |
| `POST` | `/api/ai/analyze` | *[Adapter]* Connects backend to AI Agent Brain stub |

---

## 4. Example API Usage

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

### Response:
```json
{
  "complaint_id": "CMP001",
  "status": "ANALYZING",
  "message": "Complaint received successfully",
  "complaint": {
    "id": 1,
    "complaint_id": "CMP001",
    "description": "Large pothole near the main road causing severe traffic hazard",
    "status": "ANALYZING",
    "created_at": "2026-09-20T17:00:00.000Z"
  }
}
```

### View Agent Audit Trail
```bash
curl -X GET "http://localhost:8000/api/agent/actions/CMP001"
```

### View Admin Dashboard Statistics
```bash
curl -X GET "http://localhost:8000/api/admin/stats"
```

---

## 5. Development Principles & Rules
- **Contract Adherence**: Field names strictly follow `docs/API_CONTRACT.md` and `docs/DATABASE_SCHEMA.md`.
- **Honest AI Integration**: AI fields remain `null` at intake until Faik's AI Agent Brain runs in Milestone 2.
- **Auditability**: Every agent action across PERCEIVE → REASON → DECIDE → ACT → OBSERVE is recorded in `agent_actions`.
