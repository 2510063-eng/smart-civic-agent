"""
Complaint Service

Handles business logic and database persistence for civic complaints.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Complaint, ComplaintStatus, AgentActionType
from app.schemas import ComplaintCreate
from app.services.agent_service import record_agent_action


def generate_complaint_id(db: Session) -> str:
    """
    Generates a sequential human-readable complaint ID (e.g., CMP001, CMP002).
    """
    count = db.query(func.count(Complaint.id)).scalar() or 0
    return f"CMP{(count + 1):03d}"


def create_complaint(db: Session, data: ComplaintCreate) -> Complaint:
    """
    Flow for POST /api/complaints:
    1. Validate the request (handled by Pydantic schema).
    2. Create a complaint in SQLite.
    3. Give it an initial status according to API contract (ANALYZING).
    4. Store created_at and updated_at.
    5. Create an AgentAction entry showing that the complaint was received.
    6. Return the created complaint.
    
    AI fields are kept empty/null until explicitly analyzed by Faik's AI agent in Milestone 2.
    """
    complaint_id = generate_complaint_id(db)
    now = datetime.utcnow()

    # Initial SLA placeholder (e.g., 24 hours default SLA)
    default_sla = now + timedelta(hours=24)

    # Derive address / location_text fallback
    loc_text = data.location_text or data.address
    addr_text = data.address or data.location_text
    title_text = data.title or (data.description[:60] + "..." if len(data.description) > 60 else data.description)

    complaint = Complaint(
        complaint_id=complaint_id,
        citizen_id=data.citizen_id or "CIT001",
        title=title_text,
        description=data.description,
        image_url=data.image_url,
        voice_url=data.voice_url,
        latitude=data.latitude,
        longitude=data.longitude,
        location_text=loc_text,
        address=addr_text,
        status=ComplaintStatus.ANALYZING.value,
        # AI fields are unassigned in Milestone 1
        issue_type=None,
        severity=None,
        priority=None,
        severity_score=None,
        department=None,
        confidence=None,
        reason=None,
        evidence=None,
        created_at=now,
        updated_at=now,
        sla_due_at=default_sla,
        sla_deadline=default_sla,
    )

    db.add(complaint)
    db.commit()
    db.refresh(complaint)

    # Record initial perception/intake action in the agent action audit log
    record_agent_action(
        db=db,
        complaint_id=complaint_id,
        action_type=AgentActionType.COMPLAINT_RECEIVED.value,
        description="Complaint received and logged in system. Queued for AI analysis.",
        reason="Citizen reported new civic issue via frontend intake.",
        result=f"Complaint created with ID {complaint_id}, initial status ANALYZING.",
        status="SUCCESS",
    )

    return complaint


def get_complaint_by_id(db: Session, complaint_id: str) -> Optional[Complaint]:
    """
    Finds a complaint by complaint_id (e.g. 'CMP001') or numeric primary key id.
    """
    # First search by complaint_id string
    complaint = db.query(Complaint).filter(Complaint.complaint_id == complaint_id).first()
    if not complaint and complaint_id.isdigit():
        complaint = db.query(Complaint).filter(Complaint.id == int(complaint_id)).first()
    return complaint


def list_complaints(
    db: Session,
    status: Optional[str] = None,
    department: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[Complaint]:
    """
    Returns filterable list of complaints.
    """
    query = db.query(Complaint)

    if status:
        query = query.filter(Complaint.status == status.upper())
    if department:
        query = query.filter(Complaint.department == department)
    if severity:
        query = query.filter(Complaint.severity == severity.upper())

    return query.order_by(Complaint.created_at.desc()).offset(offset).limit(limit).all()


def get_admin_stats(db: Session) -> Dict[str, int]:
    """
    Returns aggregated counts for admin dashboard.
    """
    total = db.query(func.count(Complaint.id)).scalar() or 0

    # Query counts grouped by status
    status_counts = (
        db.query(Complaint.status, func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    counts_map = {status.upper(): count for status, count in status_counts}

    return {
        "total_complaints": total,
        "new": counts_map.get("NEW", 0),
        "analyzing": counts_map.get("ANALYZING", 0),
        "assigned": counts_map.get("ASSIGNED", 0),
        "in_progress": counts_map.get("IN_PROGRESS", 0),
        "resolved": counts_map.get("RESOLVED", 0),
        "escalated": counts_map.get("ESCALATED", 0),
        "reopened": counts_map.get("REOPENED", 0),
        "closed": counts_map.get("CLOSED", 0),
    }
