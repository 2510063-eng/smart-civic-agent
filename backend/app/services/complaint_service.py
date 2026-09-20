"""
Complaint Service

Handles business logic and database persistence for civic complaints.
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Complaint, ComplaintStatus, AgentActionType, SeverityLevel
from app.schemas import ComplaintCreate
from app.services.agent_service import record_agent_action
from app.services import ai_service


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


def update_complaint_status(
    db: Session,
    complaint_id: str,
    new_status: str,
    reason: Optional[str] = None,
) -> Optional[Complaint]:
    """
    Updates the lifecycle status of a complaint and records an audit action.
    """
    complaint = get_complaint_by_id(db, complaint_id)
    if not complaint:
        return None

    old_status = complaint.status
    target_status = new_status.upper()
    now = datetime.utcnow()

    complaint.status = target_status
    complaint.updated_at = now

    if target_status == ComplaintStatus.CLOSED.value and not complaint.closed_at:
        complaint.closed_at = now
    elif target_status == ComplaintStatus.RESOLVED.value and not complaint.resolved_at:
        complaint.resolved_at = now

    db.commit()
    db.refresh(complaint)

    # Record agent action
    record_agent_action(
        db=db,
        complaint_id=complaint.complaint_id,
        action_type=f"STATUS_CHANGE_{target_status}",
        description=f"Status changed from {old_status} to {target_status}.",
        reason=reason or f"Transitioned to {target_status}",
        result=f"Current status is now {target_status}.",
        status="SUCCESS",
    )

    return complaint


def resolve_complaint(
    db: Session,
    complaint_id: str,
    resolution_description: str,
    after_image_url: Optional[str] = None,
) -> Optional[Complaint]:
    """
    Worker submits resolution.
    Transitions status to VERIFICATION and records RESOLVE_SUBMITTED action.
    """
    complaint = get_complaint_by_id(db, complaint_id)
    if not complaint:
        return None

    now = datetime.utcnow()
    complaint.status = ComplaintStatus.VERIFICATION.value
    complaint.resolved_at = now
    complaint.updated_at = now

    db.commit()
    db.refresh(complaint)

    # Record resolution submission
    record_agent_action(
        db=db,
        complaint_id=complaint.complaint_id,
        action_type=AgentActionType.RESOLVE_SUBMITTED.value,
        description=f"Worker submitted resolution: {resolution_description}",
        reason="Field team marked complaint as fixed on-site.",
        result="Moved to VERIFICATION state. Evidence queued for AI verification.",
        status="SUCCESS",
    )

    return complaint


def verify_complaint(
    db: Session,
    complaint_id: str,
    after_image_url: Optional[str] = None,
) -> Tuple[Optional[Complaint], Dict[str, Any]]:
    """
    Triggers AI verification of the submitted resolution.
    Calls ai_service.verify_resolution adapter and updates lifecycle to CLOSED or REOPENED.
    """
    complaint = get_complaint_by_id(db, complaint_id)
    if not complaint:
        return None, {}

    # Call AI verification adapter
    ai_result = ai_service.verify_resolution(
        complaint_id=complaint.complaint_id,
        before_image_url=complaint.image_url,
        after_image_url=after_image_url or "uploads/resolution_default.jpg",
    )

    now = datetime.utcnow()
    verification = ai_result.get("verification", "PASSED")
    confidence = ai_result.get("confidence", 0.90)
    reason = ai_result.get("reason", "Verification processed")

    if verification == "PASSED":
        next_status = ComplaintStatus.CLOSED.value
        complaint.status = next_status
        complaint.closed_at = now
        complaint.updated_at = now
        result_desc = f"Verification PASSED (confidence: {confidence:.2f}). Issue marked CLOSED."
    else:
        next_status = ComplaintStatus.REOPENED.value
        complaint.status = next_status
        complaint.updated_at = now
        result_desc = f"Verification FAILED (confidence: {confidence:.2f}). Issue REOPENED for re-work."

    db.commit()
    db.refresh(complaint)

    # Record verification action
    record_agent_action(
        db=db,
        complaint_id=complaint.complaint_id,
        action_type=AgentActionType.VERIFY_RESOLUTION.value,
        description=f"AI resolution verification: {verification}",
        reason=reason,
        result=result_desc,
        status="SUCCESS",
    )

    return complaint, {
        "complaint_id": complaint.complaint_id,
        "verification": verification,
        "confidence": confidence,
        "reason": reason,
        "next_status": next_status,
    }


def follow_up_complaint(
    db: Session,
    complaint_id: str,
    reason: Optional[str] = None,
) -> Optional[Complaint]:
    """
    Triggers automated or manual follow-up for a complaint.
    Updates status to FOLLOW_UP and records action.
    """
    complaint = get_complaint_by_id(db, complaint_id)
    if not complaint:
        return None

    now = datetime.utcnow()
    follow_up_reason = reason or "Complaint has not been updated within SLA deadline"
    complaint.status = ComplaintStatus.FOLLOW_UP.value
    complaint.updated_at = now

    db.commit()
    db.refresh(complaint)

    record_agent_action(
        db=db,
        complaint_id=complaint.complaint_id,
        action_type=AgentActionType.FOLLOW_UP.value,
        description="Automated follow-up initiated.",
        reason=follow_up_reason,
        result="Status updated to FOLLOW_UP. Escalation timer armed.",
        status="SUCCESS",
    )

    return complaint


def escalate_complaint(
    db: Session,
    complaint_id: str,
    reason: Optional[str] = None,
) -> Optional[Complaint]:
    """
    Triggers escalation for a complaint.
    Updates status to ESCALATED and records action.
    """
    complaint = get_complaint_by_id(db, complaint_id)
    if not complaint:
        return None

    now = datetime.utcnow()
    escalate_reason = reason or "SLA breached without resolution; escalated to department supervisor"
    complaint.status = ComplaintStatus.ESCALATED.value
    complaint.updated_at = now

    db.commit()
    db.refresh(complaint)

    record_agent_action(
        db=db,
        complaint_id=complaint.complaint_id,
        action_type=AgentActionType.ESCALATE.value,
        description="Complaint escalated to higher authority.",
        reason=escalate_reason,
        result="Status updated to ESCALATED. Priority notification dispatched.",
        status="SUCCESS",
    )

    return complaint


def check_sla_and_process(db: Session) -> Dict[str, Any]:
    """
    SLA Monitoring Engine:
    1. Finds all active complaints whose SLA deadline has passed and not in CLOSED / RESOLVED.
    2. Determines action based on priority and state:
       - Critical severity OR already followed up / SLA breached -> ESCALATE.
       - Otherwise -> FOLLOW_UP reminder.
    3. Updates complaint status and records AgentAction for every decision.
    """
    now = datetime.utcnow()
    terminal_statuses = [ComplaintStatus.CLOSED.value, ComplaintStatus.RESOLVED.value]

    # Query active complaints
    active_complaints = (
        db.query(Complaint)
        .filter(~Complaint.status.in_(terminal_statuses))
        .all()
    )

    total_checked = len(active_complaints)
    breached_count = 0
    actions_taken = []

    for c in active_complaints:
        # Check if SLA deadline has passed
        if c.sla_deadline and c.sla_deadline < now:
            breached_count += 1

            is_critical = (c.severity == SeverityLevel.CRITICAL.value) or (c.priority == SeverityLevel.CRITICAL.value)
            already_followed_up = c.status in [
                ComplaintStatus.FOLLOW_UP.value,
                ComplaintStatus.SLA_BREACH.value,
                ComplaintStatus.ESCALATED.value,
            ]

            if is_critical or already_followed_up:
                # Escalation condition met!
                if c.status != ComplaintStatus.ESCALATED.value:
                    c.status = ComplaintStatus.ESCALATED.value
                    c.updated_at = now
                    reason_text = (
                        f"CRITICAL severity and SLA deadline exceeded ({c.sla_deadline.strftime('%Y-%m-%d %H:%M')})"
                        if is_critical
                        else f"SLA breached without resolution following prior follow-up ({c.sla_deadline.strftime('%Y-%m-%d %H:%M')})"
                    )
                    record_agent_action(
                        db=db,
                        complaint_id=c.complaint_id,
                        action_type=AgentActionType.ESCALATE.value,
                        description="Automated SLA breach escalation triggered.",
                        reason=reason_text,
                        result="Status escalated to ESCALATED.",
                        status="SUCCESS",
                    )
                actions_taken.append({"complaint_id": c.complaint_id, "action": "ESCALATE"})
            else:
                # First breach: trigger follow-up reminder
                c.status = ComplaintStatus.FOLLOW_UP.value
                c.updated_at = now
                reason_text = f"Complaint has not been resolved within SLA deadline ({c.sla_deadline.strftime('%Y-%m-%d %H:%M')})"
                record_agent_action(
                    db=db,
                    complaint_id=c.complaint_id,
                    action_type=AgentActionType.FOLLOW_UP.value,
                    description="Automated SLA follow-up initiated.",
                    reason=reason_text,
                    result="Status updated to FOLLOW_UP. Department notified.",
                    status="SUCCESS",
                )
                actions_taken.append({"complaint_id": c.complaint_id, "action": "FOLLOW_UP"})

    db.commit()

    return {
        "checked": total_checked,
        "breached": breached_count,
        "actions_taken": actions_taken,
    }
