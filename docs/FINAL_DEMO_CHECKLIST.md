# Final Hackathon Demo Checklist

**Project**: Smart Civic Issue Resolution Agent  
**Repository**: `2510063-eng/smart-civic-agent`  
**Purpose**: Step-by-step presentation script for the live evaluation and walkthrough.

---

### Step 1: Start Backend
- **Command**:
  ```powershell
  cd "c:\Users\ANIKET NALAVADE\Documents\hackthon 6\backend"
  & ".\venv\Scripts\python.exe" -m uvicorn app.main:app --port 8000
  ```
- **Verification**:
  - Open `http://127.0.0.1:8000/docs` in your browser.
  - Shows interactive Swagger API docs with `/api/complaints`, `/api/ai/analyze`, `/api/agent/*`, `/api/admin/stats`.

---

### Step 2: Start Citizen Frontend & Admin Dashboard
- **Citizen Frontend (React/Vite)**:
  ```powershell
  cd "c:\Users\ANIKET NALAVADE\Documents\hackthon 6\frontend"
  npm run dev
  ```
  - Access at: `http://localhost:3000`
- **Admin Dashboard (Municipal Operations)**:
  ```powershell
  cd "c:\Users\ANIKET NALAVADE\Documents\hackthon 6"
  & ".\backend\venv\Scripts\python.exe" -m http.server 8080 --directory dashboard
  ```
  - Access at: `http://localhost:8080`

---

### Step 3: Submit Civic Complaint (Citizen Portal)
- On the Citizen Portal (`http://localhost:3000`):
  - Enter description: *"Large deep pothole with sharp edges causing vehicles to swerve dangerously near main bus station"*
  - Enter location: *"Bus Station Road, Ward 4"*
  - Upload an issue image or proceed with description.
  - Click **"Analyze with AI"**.

---

### Step 4: Show AI Analysis Results
- Point out the instant multimodal analysis card:
  - **Identified Issue**: `POTHOLE` (or corresponding category)
  - **Assessed Severity**: `HIGH` / `CRITICAL`
  - **Target Department**: `ROAD_DEPARTMENT`
  - **Explainable Reasoning**: Clear rationale explaining why the issue is severe and why the department was chosen.
  - **Confidence & Evidence**: Structured confidence score and observed evidence points.

---

### Step 5: Confirm & Show Complaint ID
- Click **"Confirm & Submit Complaint"**.
- View the generated tracking confirmation:
  - Displays generated Unique Complaint ID (e.g. `CMP021`).
  - Shows initial status: `ASSIGNED` (with `auto_process=true`).

---

### Step 6: Show SLA Deadline & Department Routing
- On the tracking card:
  - Point out the dynamic SLA deadline (e.g. 24h for HIGH, 6h for CRITICAL).
  - Point out assigned department: `ROAD_DEPARTMENT`.

---

### Step 7: Show Agent Action Timeline (Citizen View)
- Scroll down to the **Agent Action Timeline**:
  - Step 1: `COMPLAINT_RECEIVED` — logged in SQLite database.
  - Step 2: `CLASSIFY_ISSUE` — AI analysis and severity scoring.
  - Step 3: `ASSIGN_DEPARTMENT` — Routed to department with computed SLA.

---

### Step 8: Show Municipal Admin Dashboard
- Switch tab to `http://localhost:8080`:
  - Show the live KPI stats cards: Total Complaints, In Progress, Breached SLAs, Resolved.
  - Filter complaints by department (`ROAD_DEPARTMENT`) or status.
  - Locate the newly submitted complaint (`CMP021`).
  - Open complaint detail view.

---

### Step 9: Show Autonomous Follow-Up & Escalation
- In the complaint detail view or via API:
  - Show simulated SLA check / delay trigger.
  - Trigger **Follow-Up** (`POST /api/agent/follow-up/{id}`):
    - Status updates to `FOLLOW_UP`.
    - Follow-up action logged in timeline.
  - Trigger **Escalation** (`POST /api/agent/escalate/{id}`):
    - Status updates to `ESCALATED`.
    - Priority escalation notification logged in timeline.

---

### Step 10: Resolve Complaint (Worker Submission)
- Simulate field worker completing repair:
  - Submit resolution description: *"Asphalt patch applied, compacted with road roller, and surface leveled."*
  - Provide resolution image (`after_image_url`).
  - Ticket moves to `VERIFICATION` status.

---

### Step 11: Verify Resolution (AI Verification Studio)
- In the Admin Dashboard **Verification Studio**:
  - Inspect Before image vs. After image side-by-side.
  - Trigger AI verification (`POST /api/complaints/{id}/verify`):
    - **Case A (Incomplete repair)**: AI verification fails → Status moves to `REOPENED` with rework reason.
    - **Case B (Completed repair)**: AI verification passes (confidence > 0.85) → Status moves to `CLOSED`.

---

### Step 12: Show Final CLOSED Result & Audit Log
- Confirm final status is `CLOSED` with `closed_at` timestamp.
- Review complete end-to-end action log containing all 8+ agent/human steps from intake to verified closure.
