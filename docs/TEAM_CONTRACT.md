# Smart Civic Issue Resolution Agent
## Team Contract

### Hackathon
PRARAMBHA 2.0 — 24 Hour Online Hackathon

### Problem Statement
AGENTIC AI PS01 — Smart Civic Issue Resolution Agent

---

# 1. Project Goal

Build an AI-powered civic issue resolution system that does more than simply receive complaints.

The system should:

Citizen Report
→ Understand Evidence
→ Classify Issue
→ Assess Severity
→ Identify Department
→ Create Complaint
→ Monitor Status
→ Follow Up
→ Escalate
→ Verify Resolution
→ Close or Reopen

The core concept is:

**EVIDENCE → DECISION → ACTION → MONITORING → VERIFICATION**

---

# 2. Team Members

| Member | Name | Responsibility |
|---|---|---|
| Member 1 | Faik | AI / Agent Brain |
| Member 2 | Piyush | Agentic Workflow / Backend |
| Member 3 | Samyak | Citizen Frontend |
| Member 4 | Jaydeep | Admin Dashboard + Resolution Verification |

---

# 3. Responsibilities

## Faik — AI / Agent Brain

Responsible for:

- Issue classification
- Image/evidence analysis
- Text understanding
- Severity assessment
- Priority reasoning
- Department prediction
- Explainable AI output
- AI prompts/models
- Duplicate/related issue detection if feasible

Main output:

Structured AI result that can be consumed by the backend.

---

## Piyush — Agentic Workflow / Backend

Responsible for:

- Backend/API
- Database integration
- Agent orchestration
- Complaint lifecycle
- Status management
- SLA monitoring
- Automatic follow-up
- Escalation
- Agent action logs
- Integration with AI, frontend and dashboard

Main responsibility:

Turn AI decisions into actual system actions.

---

## Samyak — Citizen Frontend

Responsible for:

- Citizen interface
- Complaint submission
- Image upload
- Text description
- Location input
- AI result display
- Complaint ID
- Status tracking
- Complaint history
- Backend API integration

Main responsibility:

Make reporting and tracking simple for citizens.

---

## Jaydeep — Admin Dashboard + Verification

Responsible for:

- Municipal/admin dashboard
- Complaint list
- Complaint details
- Map visualization
- Severity/status filters
- Department information
- Agent activity timeline
- Worker resolution interface
- Before/after image verification
- Reopen/escalation display

Main responsibility:

Give authorities a clear view of issues and verify whether they were actually resolved.

---

# 4. Core System Architecture

Citizen Frontend
↓
Backend API
↓
AI / Agent Brain
↓
Classification + Evidence + Severity + Department
↓
Agentic Workflow
↓
Database
↓
Admin Dashboard
↓
Worker Resolution
↓
Resolution Verification
↓
Resolved / Reopened / Escalated

---

# 5. Agentic Workflow

The system should demonstrate:

## PERCEIVE
Receive text, image, voice and location.

↓

## REASON
Understand the issue and evidence.

↓

## DECIDE
Determine issue type, severity and responsible department.

↓

## ACT
Create and route the complaint.

↓

## OBSERVE
Monitor complaint status and SLA.

↓

## FOLLOW UP
Automatically act when the complaint is delayed.

↓

## ESCALATE
Escalate when predefined conditions are met.

↓

## VERIFY
Check whether the reported issue was actually resolved.

---

# 6. Priority Levels

Use:

- LOW
- MEDIUM
- HIGH
- CRITICAL

The AI must provide a reason for the selected severity.

Example:

Severity: HIGH

Reason:
Large pothole detected on a major road with potential safety impact.

---

# 7. Complaint Lifecycle

Possible states:

NEW
↓
ANALYZING
↓
ASSIGNED
↓
IN_PROGRESS
↓
RESOLVED
↓
VERIFICATION
↓
CLOSED

Alternative path:

IN_PROGRESS
↓
SLA_BREACH
↓
FOLLOW_UP
↓
ESCALATED

Verification failure:

VERIFICATION
↓
FAILED
↓
REOPENED
↓
ESCALATED if required

---

# 8. MVP Features

## P0 — MUST WORK

- Complaint submission
- Image/text input
- AI issue classification
- Severity assessment
- Department routing
- Complaint creation
- Complaint status tracking

## P1 — HIGH PRIORITY

- SLA monitoring
- Automatic follow-up
- Escalation
- Agent action log

## P2 — DIFFERENTIATORS

- Duplicate/issue clustering
- Before/after resolution verification

## P3 — ONLY IF TIME REMAINS

- Voice input
- Multilingual support
- Advanced analytics
- Extra animations

Do not sacrifice P0/P1 functionality for P2/P3 features.

---

# 9. Integration Rules

All modules must work as ONE system.

Faik's AI output must be usable by Piyush's backend.

Piyush's APIs must be usable by Samyak's frontend.

Piyush's APIs must be usable by Jaydeep's dashboard.

Jaydeep's verification result must update the complaint lifecycle through the backend.

Do not duplicate another member's module.

Do not create independent versions of the same functionality.

---

# 10. API Change Rule

Nobody should silently change a shared API contract.

If an API response or request format needs to change:

1. Inform the affected member.
2. Update API_CONTRACT.md.
3. Update the dependent module.
4. Test the integration.

---

# 11. GitHub Rules

### main

The `main` branch is the stable project branch.

Do not directly experiment on main.

### Personal branches

Faik:
`faik-ai`

Piyush:
`piyush-backend`

Samyak:
`samyak-frontend`

Jaydeep:
`jaydeep-dashboard`

Each member works primarily on their own branch.

Completed work should be committed with clear commit messages.

Example:

`feat: add pothole classification`

`feat: add complaint SLA monitoring`

`feat: add citizen complaint form`

`feat: add resolution verification`

Changes should be reviewed before being merged into main.

---

# 12. Communication Rule

Whenever a member completes a feature, report:

1. What was built
2. Files created/modified
3. APIs/components created
4. Input format
5. Output format
6. Dependencies
7. What another member needs to do
8. How to test it
9. Current limitations
10. Known bugs

---

# 13. Definition of Done

A feature is NOT considered complete simply because the code exists.

A feature is complete when:

- It runs
- It has been tested
- Its integration point is documented
- Another required module can use it
- Errors/failure cases are considered
- The team knows how to run it

---

# 14. Development Principle

Build a reliable working prototype before adding extra features.

A smaller working agentic workflow is more important than a large number of unfinished features.

The final demo should clearly show:

REPORT
→ AI UNDERSTANDS
→ AI DECIDES
→ SYSTEM ACTS
→ AGENT MONITORS
→ AGENT ESCALATES
→ RESOLUTION IS VERIFIED
