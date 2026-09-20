# Smart Civic Issue Resolution Agent
## API Contract

This document defines the shared API format between:

- Citizen Frontend
- Backend
- AI / Agent Brain
- Admin Dashboard
- Resolution Verification

All team members must follow these formats.

---

# 1. Base URL

Local development:

http://localhost:8000

The final production URL will be decided later.

---

# 2. Complaint Submission

## POST /api/complaints

Creates a new civic complaint.

### Request

```json
{
  "description": "Large pothole near the main road",
  "image_url": "uploads/pothole.jpg",
  "latitude": 16.7050,
  "longitude": 74.2433,
  "location_text": "Main road near bus stand",
  "citizen_id": "CIT001"
}
{
  "complaint_id": "CMP001",
  "status": "ANALYZING",
  "message": "Complaint received successfully"
}
{
  "complaint_id": "CMP001",
  "description": "Large pothole near the main road",
  "image_url": "uploads/pothole.jpg",
  "latitude": 16.7050,
  "longitude": 74.2433
}
{
  "complaint_id": "CMP001",
  "issue_type": "POTHOLE",
  "severity": "HIGH",
  "severity_score": 0.87,
  "department": "ROAD_DEPARTMENT",
  "confidence": 0.93,
  "reason": "Large pothole detected on a major road with potential safety impact",
  "evidence": [
    "Large road surface damage detected",
    "Issue appears to affect vehicle movement"
  ]
}
{
  "severity": "HIGH",
  "severity_score": 0.87,
  "reason": "Large pothole creating a potential road safety hazard"
}
{
  "complaint_id": "CMP001",
  "issue_type": "POTHOLE",
  "description": "Large pothole near the main road",
  "severity": "HIGH",
  "department": "ROAD_DEPARTMENT",
  "status": "IN_PROGRESS",
  "latitude": 16.7050,
  "longitude": 74.2433,
  "created_at": "2026-09-20T10:30:00",
  "updated_at": "2026-09-20T12:00:00"
}
{
  "complaints": [
    {
      "complaint_id": "CMP001",
      "issue_type": "POTHOLE",
      "severity": "HIGH",
      "department": "ROAD_DEPARTMENT",
      "status": "ESCALATED",
      "latitude": 16.7050,
      "longitude": 74.2433
    }
  ]
}
{
  "status": "IN_PROGRESS"
}
{
  "complaint_id": "CMP001",
  "status": "IN_PROGRESS",
  "message": "Status updated successfully"
}
{
  "complaint_id": "CMP001",
  "agent": "CivicResolutionAgent",
  "action": "ASSIGN_DEPARTMENT",
  "reason": "Issue classified as pothole",
  "result": "Assigned to ROAD_DEPARTMENT"
}
{
  "success": true,
  "message": "Agent action recorded"
}
{
  "actions": [
    {
      "action": "CLASSIFY_ISSUE",
      "reason": "Road damage detected",
      "result": "POTHOLE",
      "timestamp": "2026-09-20T10:31:00"
    },
    {
      "action": "ASSIGN_DEPARTMENT",
      "reason": "Pothole requires road department",
      "result": "ROAD_DEPARTMENT",
      "timestamp": "2026-09-20T10:32:00"
    }
  ]
}
{
  "checked": 10,
  "breached": 2,
  "actions_taken": [
    {
      "complaint_id": "CMP004",
      "action": "FOLLOW_UP"
    },
    {
      "complaint_id": "CMP007",
      "action": "ESCALATE"
    }
  ]
}
{
  "reason": "Complaint has not been updated within SLA"
}
{
  "complaint_id": "CMP001",
  "action": "FOLLOW_UP",
  "status": "FOLLOW_UP",
  "message": "Follow-up initiated"
}
{
  "reason": "SLA breached without resolution"
}
{
  "resolution_description": "Pothole repaired",
  "after_image_url": "uploads/pothole_after.jpg"
}
{
  "complaint_id": "CMP001",
  "status": "VERIFICATION",
  "message": "Resolution submitted for verification"
}
{
  "after_image_url": "uploads/pothole_after.jpg"
}
{
  "complaint_id": "CMP001",
  "verification": "PASSED",
  "confidence": 0.91,
  "reason": "After-image shows repaired road surface",
  "next_status": "CLOSED"
}
{
  "verification": "FAILED",
  "confidence": 0.82,
  "reason": "Road damage is still visible",
  "next_status": "REOPENED"
}
{
  "total_complaints": 120,
  "new": 15,
  "in_progress": 32,
  "resolved": 48,
  "escalated": 10,
  "reopened": 5,
  "closed": 10
}
{
  "success": false,
  "error": "Complaint not found",
  "code": "COMPLAINT_NOT_FOUND"
}


