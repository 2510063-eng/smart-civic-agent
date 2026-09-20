# CivicResolve AI — Municipal Admin & Verification Dashboard

**Module Owner**: Jaydeep (Member 4 — Admin Dashboard + Resolution Verification)  
**Hackathon**: PRARAMBHA 2.0  
**Problem Statement**: AGENTIC AI PS01 — Smart Civic Issue Resolution Agent  

---

## 1. Overview

The **Municipal Admin & Verification Dashboard** serves as the central command center for city authorities and supervisors. It enables municipal operators to monitor civic complaints, inspect autonomous AI perception and reasoning pipelines, supervise field worker dispatches, track real-time SLA urgency, and audit field repairs using **Before vs After AI Verification**.

---

## 2. Key Features

- **Spatial GIS Command Map**: Powered by Leaflet.js with custom color-coded pins, pulsing alerts for SLA breaches, and layer filtering by municipal department.
- **Autonomous Agent Timeline**: Live audit stream recording every automated agent action (`PERCEIVE_EVIDENCE`, `CLASSIFY_ISSUE`, `ASSIGN_DEPARTMENT`, `SLA_BREACH_CHECK`, `FOLLOW_UP`, `ESCALATE`, `VERIFY_RESOLUTION`).
- **Deep AI Complaint Inspector**: Displays computer vision classifications, calculated severity scores, explainable evidence checklists, confidence ratings, and duplicate cluster warnings.
- **Before & After AI Resolution Verification Studio**: Side-by-side visual comparison between the citizen's initial damage photo and the worker's completion evidence, with AI verification confidence and authority sign-off controls (Approve & Close vs. Reject, Reopen & Escalate).
- **Interactive Analytics (Chart.js)**: Live department workload bars, issue category distribution doughnuts, and SLA compliance gauges.
- **Field Worker Roster**: Tracks operative availability, contact details, and active workload.
- **"Connect Further" API Settings**: Easily toggle between **Standalone Mock Data Mode** (zero backend required, ideal for hackathon presentations) and **Live Backend Mode** (connects to FastAPI at `http://localhost:8000/api` adhering to `docs/API_CONTRACT.md`).
- **2-Minute Demo Walkthrough**: Interactive one-click demo sequence that walks through citizen report ingestion, AI routing, worker dispatch, and verification.

---

## 3. How to Run Locally

### Option A: Via Python Runner (Recommended)
From the project root:
```bash
python dashboard/run_dashboard.py
```
Then open your browser at:
```text
http://localhost:3000
```

### Option B: Open Directly in Any Browser
You can open `dashboard/index.html` directly in Google Chrome, Microsoft Edge, or Mozilla Firefox — no server required!

---

## 4. Connecting Further to the Backend API

1. Click on the **Standalone Mode** / Settings button in the top right navigation bar.
2. Select **Connect to Backend API**.
3. Enter your backend URL (e.g., `http://localhost:8000`).
4. Click **Test** to verify endpoint availability (`/api/complaints`).
5. Click **Save Settings**. The dashboard will now sync live complaints and dispatches directly with the backend server.
