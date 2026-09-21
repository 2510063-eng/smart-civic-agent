# Smart Civic Issue Resolution Agent — Final Project Summary

**Project**: Smart Civic Issue Resolution Agent  
**Repository**: `2510063-eng/smart-civic-agent`  
**Event**: PRARAMBHA 2.0 Hackathon  

---

## 1. Problem Statement
Traditional civic issue reporting mechanisms in municipal corporations face several systemic bottlenecks:
- **Manual Triage & Misrouting**: Citizen complaints submitted via email, phone, or simple web forms require manual review, often leading to misassigned departments and days of delay before work begins.
- **Lack of Objective Prioritization**: High-hazard issues (e.g., exposed live electrical wires, deep highway potholes) are treated with the same priority as low-urgency cosmetic defects.
- **Missing SLA Enforcement**: Once dispatched, complaints frequently stagnate without automated progress checks or timely escalations to senior officials.
- **Premature & False Closures**: Field workers often mark tickets as "resolved" without objective proof, forcing citizens to repeatedly re-file the same complaint.
- **Zero Transparency**: Citizens have no visibility into what the administration is doing behind the scenes.

---

## 2. Proposed Solution
The **Smart Civic Issue Resolution Agent** is an autonomous, agentic system that manages the full lifecycle of a civic issue from intake to verified closure:
1. **Intake & Understanding**: Ingests citizen reports with text, images, and geolocation.
2. **Autonomous Triage**: Categorizes the issue, determines severity, and assigns the appropriate municipal department with an enforceable SLA deadline.
3. **Continuous Monitoring**: Tracks SLA countdowns and autonomously triggers follow-ups or escalations when deadlines are threatened.
4. **Verified Resolution**: Evaluates worker-submitted Before/After visual evidence before officially closing tickets or reopening them for rework.
5. **Full Auditability**: Logs every agentic and human action in an immutable timeline visible to both citizens and administrators.

---

## 3. System Architecture

```
+------------------------+      +---------------------------+
|    Citizen Portal      |      |      Admin Dashboard      |
|  (React 19 + Vite)     |      |  (HTML5 / CSS / Vanilla)  |
+-----------+------------+      +-------------+-------------+
            |                                 |
            +----------------+----------------+
                             | (REST API)
                             v
               +---------------------------+
               |     FastAPI Backend       |
               | (Routing, Validation,     |
               |  State Machine, SLA)      |
               +-------------+-------------+
                             |
         +-------------------+-------------------+
         |                                       |
         v                                       v
+------------------+                   +--------------------+
|  SQLite Database |                   | AI Service Adapter |
| (SQLAlchemy ORM) |                   |  & Agent Brain     |
+------------------+                   +--------------------+
```

- **Frontend (`frontend/`)**: React 19 Single Page Application built with Vite and Lucide React. Provides citizen intake, instant AI preview, complaint submission, and live tracking with agent timeline.
- **Backend (`backend/`)**: FastAPI server implementing REST endpoints, strict Pydantic v2 schemas, and a deterministic state transition machine.
- **Database (`backend/civic_issues.db`)**: SQLite with SQLAlchemy models (`Complaint`, `AgentAction`, `DepartmentWorker`).
- **Dashboard (`dashboard/`)**: Responsive municipal operations dashboard providing real-time KPI metrics, SLA countdowns, and an interactive Before/After Verification Studio.
- **AI Agent Foundation (`ai_agent/`)**: System prompts, classification schemas, and configuration designed for Gemini integration, coupled with `AIServiceAdapter` in `backend/app/services/ai_service.py`.

---

## 4. Agentic Workflow & State Transitions

The complaint lifecycle follows a deterministic, unidirectional finite state machine:

```
[ANALYZING]
    │
    ▼ (AI Classification & Department Assignment)
[ASSIGNED]
    │
    ▼ (Worker Dispatched)
[IN_PROGRESS] ──────► [FOLLOW_UP] (Overdue warning triggered)
    │                      │
    │                      ▼
    ├───────────────► [ESCALATED] (Critical breach / prolonged delay)
    │
    ▼ (Worker Submits Fix)
[VERIFICATION]
    ├───► (Verification PASSED) ──► [CLOSED]
    └───► (Verification FAILED) ──► [REOPENED] ──► [IN_PROGRESS]
```

Every state transition generates an immutable `AgentAction` entry with timestamp, action type, description, and execution result.

---

## 5. AI Capabilities & Integration Status

The backend connects to AI capabilities via `AIServiceAdapter` (`backend/app/services/ai_service.py`), supporting:
- **Issue Classification**: Maps input to standard civic types (`POTHOLE`, `GARBAGE`, `STREET_LIGHT`, `WATER_LEAKAGE`, `DRAINAGE`, `OTHER`).
- **Severity Scoring**: Computes a continuous severity score (0.0 to 1.0) and assigns category (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Department Routing**: Directs complaints to `ROAD_DEPARTMENT`, `SOLID_WASTE_MANAGEMENT`, `WATER_SUPPLY`, `ELECTRICAL_DEPARTMENT`, or `DRAINAGE_DEPARTMENT`.
- **Explainable Reasoning & Evidence**: Provides structured rationale explaining the classification decision.
- **Resolution Verification**: Evaluates After images against Before images to confirm problem resolution.
- **Duplicate & Proximity Detection**: Evaluates geospatial distance (Haversine formula) and temporal window to flag potential duplicate complaints (`GET /api/complaints/{id}/related`).

*Current Status*: The prototype currently executes using the deterministic heuristic engine (`is_stub: True`) ensuring 100% predictable, offline-safe execution during evaluation. Registration hooks (`register_ai_brain_analyzer`, `register_ai_brain_verifier`) are in place for production Gemini LLM pipelines.

---

## 6. SLA Monitoring Mechanism

SLAs are dynamically computed based on severity:
- **CRITICAL**: 6-hour resolution window
- **HIGH**: 24-hour resolution window
- **MEDIUM**: 48-hour resolution window
- **LOW**: 72-hour resolution window

The background engine (`POST /api/agent/sla-check`):
1. Queries all non-closed complaints whose `sla_deadline` has passed.
2. For critical complaints: autonomously triggers `ESCALATE` to senior officials.
3. For standard complaints: autonomously triggers `FOLLOW_UP` and dispatches reminders to assigned workers.

---

## 7. Municipal Admin Dashboard

The dashboard (`dashboard/`) provides:
- **Live KPI Overview**: Real-time counters for Total Complaints, In-Progress, Breached SLAs, and Resolved.
- **Department Breakdown**: Visual distribution of complaints across municipal departments.
- **Complaint Management**: Searchable and filterable complaint table with status badges and SLA countdowns.
- **Detail View & Action Execution**: Side-drawer displaying complaint metadata, location coordinates, and action timeline.
- **Verification Studio**: Visual comparison workspace allowing administrators to inspect Before and After repair photos and trigger AI verification.

---

## 8. Testing Results

All tests are implemented in `backend/test_api.py` and run against the FastAPI application:
- **Total Test Suites**: 11
- **Suites Passed**: 11 (100%)
- **Suites Failed**: 0
- **Covered Scenarios**:
  1. Core API & Foundation Endpoints (`GET /`, `POST /api/complaints`, `GET /api/complaints/{id}`)
  2. Complaint Lifecycle & State Transitions (`PATCH /status`, `POST /agent/follow-up`, `POST /agent/escalate`)
  3. Worker Resolution & AI Verification (Failure $\to$ `REOPENED`, Re-submission $\to$ `CLOSED`)
  4. SLA Monitoring & Autonomous Breach Engine (`POST /agent/sla-check`)
  5. Audit Logging & Agent Action Timeline (`GET /agent/actions/{id}`)
  6. Admin Dashboard Metrics (`GET /api/admin/stats`)
  7. AI Adapter & Structured Output Verification (`POST /api/ai/analyze`)
  8. Automatic Complaint Processing Workflow (`POST /api/complaints?auto_process=true`)
  9. Duplicate & Proximity Detection (`GET /api/complaints/{id}/related`)
  10. Enhanced Admin Dashboard Metrics
  11. Error Handling & State Machine Integrity (404, 400 invalid status, 400 closed ticket actions)

---

## 9. Team Responsibilities

- **Piyush**: Backend architecture, FastAPI REST API, database models & migrations, deterministic state machine, SLA breach engine, AI service adapter, and Citizen Frontend takeover (`frontend/`).
- **Jaydeep**: Municipal Admin Dashboard UI, KPI charts, complaint listing, detail drawer, and Before/After Verification Studio (`dashboard/`).
- **Faik**: AI agent foundation, system prompts, output schemas, and configuration for LLM integration (`ai_agent/`).
