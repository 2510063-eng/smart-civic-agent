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

## 3. Implemented API Endpoints (Milestones 1, 2 & 3)

### Complaints & Lifecycle
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/complaints` | Create a complaint (`auto_process=true` immediately classifies and assigns) |
| `GET` | `/api/complaints` | List complaints with optional `status`, `department`, `severity` filters |
| `GET` | `/api/complaints/{id}` | Retrieve details for a single complaint |
| `POST` | `/api/complaints/{id}/process` | Trigger automated AI classification, dynamic SLA target, and department routing |
| `GET` | `/api/complaints/{id}/related` | Heuristic duplicate and related complaint detection (proximity & issue match) |
| `PATCH` | `/api/complaints/{id}/status` | Update lifecycle status (e.g. `ASSIGNED`, `IN_PROGRESS`, `ESCALATED`) |
| `POST` | `/api/complaints/{id}/resolve` | Worker submits resolution proof -> transitions to `VERIFICATION` |
| `POST` | `/api/complaints/{id}/verify` | AI Before/After verification -> transitions to `CLOSED` (pass) or `REOPENED` (fail) |

### Agentic Workflow & Admin
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/agent/actions/{id}` | Retrieve chronological agent action audit trail for a complaint |
| `GET` | `/api/admin/stats` | Aggregated dashboard stats (unresolved, SLA breached, by dept, by severity, avg time) |
| `POST` | `/api/agent/sla-check` | Autonomous SLA engine checking deadlines, triggering `FOLLOW_UP` or `ESCALATE` |
| `POST` | `/api/agent/follow-up/{id}` | Trigger follow-up reminder for an overdue/unresolved complaint |
| `POST` | `/api/agent/escalate/{id}` | Trigger escalation to higher authority for an unresolved complaint |
| `POST` | `/api/agent/process/{id}` | Agent orchestration endpoint to process complaint through AI pipeline |
| `POST` | `/api/ai/analyze` | Adapter endpoint connecting backend to AI Agent Brain |

---

## 4. Agentic Workflow Lifecycle

```text
COMPLAINT_RECEIVED (POST /api/complaints)
      ↓
AI ANALYSIS & CLASSIFICATION (POST /api/complaints/{id}/process)
      ├─ CLASSIFY_ISSUE (issue_type, severity, priority, evidence)
      ├─ ASSIGN_DEPARTMENT (responsible dept, dynamic SLA deadline)
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

Every single state change, AI classification, department assignment, SLA check, and verification decision is automatically written to the `agent_actions` audit log in SQLite.

---

## 5. AI Brain Integration Contract (for Faik / `ai-agent/`)

The backend connects to Faik's AI Brain via `backend/app/services/ai_service.py`.

### Registration Hook
Faik can register his AI model directly without modifying any API routes:
```python
from app.services.ai_service import register_ai_brain_analyzer, register_ai_brain_verifier

def my_ai_analyzer(complaint_id, description, image_url=None, latitude=None, longitude=None):
    # Call Gemini / Vision / LLM pipeline
    return {
        "complaint_id": complaint_id,
        "issue_type": "POTHOLE",
        "severity": "HIGH",
        "priority": "HIGH",
        "severity_score": 0.88,
        "department": "ROAD_DEPARTMENT",
        "confidence": 0.94,
        "reason": "Large asphalt cavity detected on arterial roadway with vehicular disruption.",
        "evidence": ["Visual crater detected in image", "Roadway safety risk"],
    }

register_ai_brain_analyzer(my_ai_analyzer)
```

If no external analyzer is registered, the backend transparently uses the heuristic adapter stub flagged with `is_stub: True`.

---

## 6. Example API Usage

### Create a Complaint with Auto-Processing
```bash
curl -X POST "http://localhost:8000/api/complaints?auto_process=true" \
     -H "Content-Type: application/json" \
     -d '{
       "description": "Large dangerous pothole near the main road causing traffic hazard",
       "image_url": "uploads/pothole.jpg",
       "latitude": 16.7050,
       "longitude": 74.2433,
       "location_text": "Main road near central bus stand",
       "citizen_id": "CIT001"
     }'
```

### Check for Duplicate / Related Issues
```bash
curl -X GET "http://localhost:8000/api/complaints/CMP001/related"
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

### Get Admin Dashboard Metrics
```bash
curl -X GET "http://localhost:8000/api/admin/stats"
```

---

## 7. Development Principles & Rules
- **Contract Adherence**: Field names and endpoint signatures strictly follow `docs/API_CONTRACT.md` and `docs/DATABASE_SCHEMA.md`.
- **Honest AI Integration**: AI outputs are clearly flagged with `is_stub: True` until Faik registers his model.
- **Traceability & Auditability**: Every agent action across PERCEIVE → REASON → DECIDE → ACT → OBSERVE → FOLLOW UP → ESCALATE → VERIFY is recorded in `agent_actions`.

---

## 8. Hackathon Demo Walkthrough (for Teammates)

To demonstrate the full agentic civic issue resolution workflow during the hackathon evaluation:

### 1. Start the Server
```bash
cd backend
uvicorn app.main:app --reload --port 8000
```
Interactive API documentation: `http://localhost:8000/docs`

### 2. Run Automated Verification Suite (11 Suites)
```bash
python test_api.py
```

### 3. Demo Storyboard
1. **Citizen Reports Issue**: Call `POST /api/complaints?auto_process=true` with description and image.
2. **AI Autonomous Classification**: System immediately classifies issue (`POTHOLE`), assigns department (`ROAD_DEPARTMENT`), sets severity (`HIGH`), and calculates dynamic SLA (24h).
3. **Agent Action Audit Log**: Call `GET /api/agent/actions/{id}` to show `COMPLAINT_RECEIVED`, `CLASSIFY_ISSUE`, `ASSIGN_DEPARTMENT`.
4. **Duplicate Detection**: Call `GET /api/complaints/{id}/related` to demonstrate spatial and issue clustering for municipal efficiency.
5. **SLA Breach & Escalation**: Run `POST /api/agent/sla-check` to show autonomous background monitoring and auto-escalation of overdue critical issues.
6. **Worker Resolution**: Call `POST /api/complaints/{id}/resolve` to submit field fix evidence (`VERIFICATION`).
7. **AI Verification**: Call `POST /api/complaints/{id}/verify`:
   - Fails verification $\to$ transitions to `REOPENED` with rework reason.
   - Passes verification $\to$ transitions to `CLOSED` with resolution timestamp.
8. **Admin Metrics**: Call `GET /api/admin/stats` to show real-time municipal dashboard metrics (unresolved count, SLA breached count, breakdown by department and severity).


