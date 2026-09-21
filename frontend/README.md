# Smart Civic - AI-Powered Civic Issue Resolution Agent (Citizen Frontend)

> **Autonomous Closed-Loop Municipal Infrastructure Resolution Swarm**  
> Built for 24-Hour AI Hackathon

## Team Ownership
- **Faik**: AI / Agent Brain
- **Piyush**: Agentic Workflow / Backend
- **Samyak**: Citizen Frontend Lead
- **Jaydeep**: Admin Dashboard + Resolution Verification

---

## Overview
Smart Civic is an agentic AI system for multimodal civic hazard ingestion (potholes, garbage accumulation, damaged streetlights, pipeline bursts). Rather than acting as a simple complaint form or static chatbot, the frontend visualizes and drives a full autonomous closed-loop:

$$\text{EVIDENCE} \longrightarrow \text{DECISION} \longrightarrow \text{ACTION} \longrightarrow \text{MONITORING} \longrightarrow \text{VERIFICATION}$$

### Agent Swarm Pipeline
1. **Citizen Report**: Multimodal validation (photo, geo-coordinates, text description, voice transcription).
2. **Evidence Agent**: Computer vision defect analysis and feature extraction.
3. **Severity Agent**: Impact assessment and hazard priority calculation.
4. **Duplicate Agent**: Geospatial 500m vector radius deduplication & clustering.
5. **Department Routing Agent**: Municipal taxonomy classification (Roads, Sanitation, Lighting, Water Board).
6. **Complaint Generation**: Cryptographic immutable ticket creation (`CIV-2026-XXXXX`).
7. **Monitoring Agent**: Autonomous watchdog monitoring lifecycle milestones.
8. **SLA Monitoring**: 48-Hour municipal guarantee countdown timer.
9. **Resolution Verification**: Dual-photo before/after computer vision inspection (Resolved with 96% confidence vs. Reopened with automatic Chief Engineer escalation).

---

## Files Included
- `index.html`: Municipal-tech dashboard layout with glassmorphism, responsive navigation tabs, and multimodal inputs.
- `style.css`: Dark navy/cyan design system with custom animations (glow pulse, waveform visualizer, radar scan).
- `script.js`: Centralized API configuration (`http://localhost:8000/api`) with autonomous fallback demo simulation and telemetry trace logging.

---

## How to Run
Simply open `index.html` in any modern web browser or serve via any static web server:

```bash
# Option 1: Direct browser
double-click index.html

# Option 2: Python HTTP Server
python3 -m http.server 3000

# Option 3: Node / npx serve
npx serve .
```

## Backend API Specification
The frontend connects to the following endpoints when online:
- `POST /api/complaints`: Submit new complaint payload
- `POST /api/complaints/{id}/analyze`: Run agent swarm pipeline
- `GET /api/complaints/{id}`: Retrieve structured ticket
- `GET /api/complaints/{id}/status`: Lifecycle state polling
- `POST /api/complaints/{id}/verification`: Submit before/after repair proof
