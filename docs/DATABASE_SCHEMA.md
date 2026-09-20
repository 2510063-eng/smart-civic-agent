# Smart Civic Issue Resolution Agent
## Database Schema

This document defines the shared database structure for the project.

All team members must follow these field names and meanings when working with complaint data.

---

# 1. Main Entity

The main database entity is:

**Complaint**

Each complaint represents one civic issue reported by a citizen.

---

# 2. Complaint Fields

| Field | Type | Description |
|---|---|---|
| complaint_id | String | Unique complaint identifier |
| citizen_id | String | Identifier of the citizen |
| description | String | Citizen's description of the issue |
| image_url | String | URL/path of uploaded evidence image |
| voice_url | String | URL/path of uploaded voice evidence |
| latitude | Float | Latitude of reported location |
| longitude | Float | Longitude of reported location |
| location_text | String | Human-readable location |
| issue_type | String | Classified civic issue |
| severity | String | LOW, MEDIUM, HIGH or CRITICAL |
| severity_score | Float | AI severity score |
| department | String | Responsible department |
| confidence | Float | AI confidence score |
| reason | String | Explanation for AI decision |
| status | String | Current complaint lifecycle status |
| created_at | DateTime | Complaint creation time |
| updated_at | DateTime | Last update time |
| sla_deadline | DateTime | Expected resolution deadline |
| resolved_at | DateTime | Time when issue was marked resolved |
| closed_at | DateTime | Time when complaint was closed |

---

# 3. Example Complaint Record

```json
{
  "complaint_id": "CMP001",
  "citizen_id": "CIT001",
  "description": "Large pothole near the main road",
  "image_url": "uploads/pothole.jpg",
  "voice_url": null,
  "latitude": 16.7050,
  "longitude": 74.2433,
  "location_text": "Main road near bus stand",
  "issue_type": "POTHOLE",
  "severity": "HIGH",
  "severity_score": 0.87,
  "department": "ROAD_DEPARTMENT",
  "confidence": 0.93,
  "reason": "Large pothole detected on a major road with potential safety impact",
  "status": "ASSIGNED",
  "created_at": "2026-09-20T10:30:00",
  "updated_at": "2026-09-20T10:32:00",
  "sla_deadline": "2026-09-21T10:30:00",
  "resolved_at": null,
  "closed_at": null
}
severity = HIGH
severity_score = 0.87
{
  "action_id": "ACT001",
  "complaint_id": "CMP001",
  "agent": "CivicResolutionAgent",
  "action": "ASSIGN_DEPARTMENT",
  "reason": "Issue classified as pothole",
  "result": "Assigned to ROAD_DEPARTMENT",
  "timestamp": "2026-09-20T10:32:00"
}
{
  "resolution_id": "RES001",
  "complaint_id": "CMP001",
  "resolution_description": "Pothole repaired",
  "after_image_url": "uploads/pothole_after.jpg",
  "submitted_at": "2026-09-21T09:00:00",
  "verification_status": "PASSED",
  "verification_confidence": 0.91,
  "verification_reason": "After-image shows repaired road surface"
}
Citizen
   |
   | submits
   ↓
Complaint
   |
   ├── AI Analysis
   |
   ├── Agent Actions
   |
   ├── Resolution
   |
   └── Verification
issue_type
severity
severity_score
department
confidence
reason
evidence
{
  "issue_type": "POTHOLE",
  "severity": "HIGH",
  "severity_score": 0.87,
  "department": "ROAD_DEPARTMENT",
  "confidence": 0.93,
  "reason": "Large pothole detected on a major road",
  "evidence": [
    "Large road surface damage detected",
    "Issue appears to affect vehicle movement"
  ]
}
created_at:
2026-09-20T10:30:00

sla_deadline:
2026-09-21T10:30:00
SLA_BREACH
→ FOLLOW_UP
→ ESCALATED
{
  "duplicate_of": "CMP001",
  "similarity_score": 0.91,
  "cluster_id": "CLUSTER005"
}
verification_status
verification_confidence
verification_reason
PASSED
↓
CLOSED
FAILED
↓
REOPENED
complaint_id
complaintId

### Then save it

Click **Commit changes…**

Commit message:

```text
docs: add database schema

