import math
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any, Tuple
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


def create_complaint(db: Session, data: ComplaintCreate, auto_process: bool = False) -> Complaint:
    """
    Flow for POST /api/complaints:
    1. Validate the request (handled by Pydantic schema).
    2. Create a complaint in SQLite.
    3. Give it an initial status according to API contract (ANALYZING).
    4. Store created_at and updated_at.
    5. Create an AgentAction entry showing that the complaint was received.
    6. If auto_process is True, immediately trigger AI processing workflow.
    7. Return the created complaint.
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

    if auto_process:
        complaint, _ = process_complaint_with_ai(db, complaint_id)

    return complaint


def process_complaint_with_ai(
    db: Session,
    complaint_id: str,
    custom_ai_result: Optional[Dict[str, Any]] = None,
) -> Tuple[Optional[Complaint], List[str]]:
    """
    Automated Complaint Processing Workflow:
    1. Retrieve complaint by ID.
    2. Pass evidence/description to AIServiceAdapter (or use custom_ai_result).
    3. Update complaint record with classified issue_type, severity, priority, department, reason, evidence.
    4. Compute dynamic SLA deadline based on severity:
       - CRITICAL: 6 hours
       - HIGH: 24 hours
       - MEDIUM: 48 hours
       - LOW: 72 hours
    5. Transition status to ASSIGNED.
    6. Record traceable AgentActions:
       - CLASSIFY_ISSUE
       - ASSIGN_DEPARTMENT
    7. Commit changes and return updated complaint and list of logged actions.
    """
    complaint = get_complaint_by_id(db, complaint_id)
    if not complaint:
        return None, []

    ai_data = custom_ai_result or ai_service.analyze_complaint(
        complaint_id=complaint.complaint_id,
        description=complaint.description,
        image_url=complaint.image_url,
        latitude=complaint.latitude,
        longitude=complaint.longitude,
    )

    now = datetime.utcnow()
    issue_type = ai_data.get("issue_type", "OTHER")
    severity = (ai_data.get("severity") or "LOW").upper()
    priority = (ai_data.get("priority") or severity).upper()
    severity_score = float(ai_data.get("severity_score", 0.5))
    department = ai_data.get("department", "GENERAL")
    confidence = float(ai_data.get("confidence", 0.5))
    reason = ai_data.get("reason") or ai_data.get("reasoning") or "AI classification completed"
    raw_evidence = ai_data.get("evidence", [])
    evidence_str = json.dumps(raw_evidence) if isinstance(raw_evidence, list) else str(raw_evidence)

    # Dynamic SLA calculation based on severity
    if severity == SeverityLevel.CRITICAL.value:
        sla_hours = 6
    elif severity == SeverityLevel.HIGH.value:
        sla_hours = 24
    elif severity == SeverityLevel.MEDIUM.value:
        sla_hours = 48
    else:
        sla_hours = 72

    sla_deadline = (complaint.created_at or now) + timedelta(hours=sla_hours)

    complaint.issue_type = issue_type
    complaint.severity = severity
    complaint.priority = priority
    complaint.severity_score = severity_score
    complaint.department = department
    complaint.confidence = confidence
    complaint.reason = reason
    complaint.evidence = evidence_str
    complaint.sla_deadline = sla_deadline
    complaint.sla_due_at = sla_deadline
    complaint.status = ComplaintStatus.ASSIGNED.value
    complaint.updated_at = now

    db.commit()
    db.refresh(complaint)

    # 1. Action: CLASSIFY_ISSUE
    record_agent_action(
        db=db,
        complaint_id=complaint.complaint_id,
        action_type=AgentActionType.CLASSIFY_ISSUE.value,
        description=f"AI classified issue as {issue_type} with {severity} severity.",
        reason=reason,
        result=f"Issue: {issue_type}, Severity: {severity} (Score: {severity_score:.2f}, Confidence: {confidence:.2f}).",
        status="SUCCESS",
    )

    # 2. Action: ASSIGN_DEPARTMENT
    record_agent_action(
        db=db,
        complaint_id=complaint.complaint_id,
        action_type=AgentActionType.ASSIGN_DEPARTMENT.value,
        description=f"Complaint assigned to {department}.",
        reason=f"Responsible department for issue type '{issue_type}'.",
        result=f"Assigned to {department}. Dynamic SLA target set to {sla_hours} hours ({sla_deadline.strftime('%Y-%m-%d %H:%M UTC')}).",
        status="SUCCESS",
    )

    return complaint, [AgentActionType.CLASSIFY_ISSUE.value, AgentActionType.ASSIGN_DEPARTMENT.value]


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


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great-circle distance between two points on Earth in meters
    using the Haversine formula.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) *
         math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def find_related_complaints(
    db: Session,
    complaint_id: str,
    max_distance_meters: float = 2000.0,
    time_window_hours: float = 168.0,
) -> List[Dict[str, Any]]:
    """
    Lightweight heuristic foundation for identifying potentially related complaints
    or duplicates without claiming fake ML.
    
    Checks:
    1. Issue type match (+0.45 score).
    2. Geographical proximity within max_distance_meters (up to +0.45 score).
    3. Temporal proximity within time_window_hours (up to +0.10 score).
    
    Returns potential related complaints flagged as 'POTENTIAL_DUPLICATE' or 'RELATED_ISSUE'
    with transparent reasons.
    """
    target = get_complaint_by_id(db, complaint_id)
    if not target:
        return []

    window_start = (target.created_at or datetime.utcnow()) - timedelta(hours=time_window_hours)
    candidates = (
        db.query(Complaint)
        .filter(Complaint.id != target.id)
        .filter(Complaint.created_at >= window_start)
        .all()
    )

    results = []

    for cand in candidates:
        score = 0.0
        reasons = []
        distance_m = None

        # 1. Issue Type Check
        if target.issue_type and cand.issue_type and target.issue_type == cand.issue_type:
            score += 0.45
            reasons.append(f"Same issue type: {target.issue_type}")
        elif not target.issue_type and not cand.issue_type:
            # If unclassified, check keyword overlap in description
            target_words = set(target.description.lower().split())
            cand_words = set(cand.description.lower().split())
            overlap = target_words.intersection(cand_words)
            if len(overlap) >= 2:
                score += 0.25
                reasons.append("Shared keywords in citizen description")

        # 2. Location Check
        if target.latitude is not None and target.longitude is not None and cand.latitude is not None and cand.longitude is not None:
            distance_m = round(calculate_haversine_distance(
                target.latitude, target.longitude, cand.latitude, cand.longitude
            ), 1)

            if distance_m <= 100.0:
                score += 0.45
                reasons.append(f"Immediate proximity: {distance_m}m away")
            elif distance_m <= 500.0:
                score += 0.35
                reasons.append(f"Close neighborhood proximity: {distance_m}m away")
            elif distance_m <= max_distance_meters:
                score += 0.20
                reasons.append(f"In same general area: {distance_m}m away")
        elif target.location_text and cand.location_text:
            if target.location_text.strip().lower() == cand.location_text.strip().lower():
                score += 0.30
                reasons.append(f"Matching location text: '{target.location_text}'")

        # 3. Time Check
        if target.created_at and cand.created_at:
            time_diff_hours = abs((cand.created_at - target.created_at).total_seconds()) / 3600.0
        else:
            time_diff_hours = 0.0

        if time_diff_hours <= 24.0:
            score += 0.10
            reasons.append(f"Reported within {round(time_diff_hours, 1)}h of each other")
        elif time_diff_hours <= 72.0:
            score += 0.05
            reasons.append(f"Reported within {round(time_diff_hours, 1)}h")

        final_score = round(min(score, 1.0), 2)

        # Include if candidate has meaningful similarity
        if final_score >= 0.40:
            relationship = "POTENTIAL_DUPLICATE" if final_score >= 0.70 else "RELATED_ISSUE"
            results.append({
                "complaint_id": cand.complaint_id,
                "issue_type": cand.issue_type,
                "status": cand.status,
                "similarity_score": final_score,
                "relationship": relationship,
                "distance_meters": distance_m,
                "time_difference_hours": round(time_diff_hours, 1),
                "reasons": reasons,
                "created_at": cand.created_at,
            })

    # Sort highest similarity first
    results.sort(key=lambda x: x["similarity_score"], reverse=True)
    return results


def get_admin_stats(db: Session) -> Dict[str, Any]:
    """
    Returns aggregated metrics for admin dashboard.
    """
    now = datetime.utcnow()
    total = db.query(func.count(Complaint.id)).scalar() or 0

    status_counts = (
        db.query(Complaint.status, func.count(Complaint.id))
        .group_by(Complaint.status)
        .all()
    )
    counts_map = {status.upper(): count for status, count in status_counts}

    # Department breakdown
    dept_counts = (
        db.query(Complaint.department, func.count(Complaint.id))
        .filter(Complaint.department.isnot(None))
        .group_by(Complaint.department)
        .all()
    )
    by_department = {d: c for d, c in dept_counts if d}

    # Severity breakdown
    sev_counts = (
        db.query(Complaint.severity, func.count(Complaint.id))
        .filter(Complaint.severity.isnot(None))
        .group_by(Complaint.severity)
        .all()
    )
    by_severity = {s: c for s, c in sev_counts if s}

    # Unresolved complaints (not in CLOSED or RESOLVED)
    terminal_statuses = [ComplaintStatus.CLOSED.value, ComplaintStatus.RESOLVED.value]
    unresolved_count = (
        db.query(func.count(Complaint.id))
        .filter(~Complaint.status.in_(terminal_statuses))
        .scalar() or 0
    )

    # SLA breached count (unresolved AND past sla_deadline)
    sla_breached_count = (
        db.query(func.count(Complaint.id))
        .filter(~Complaint.status.in_(terminal_statuses))
        .filter(Complaint.sla_deadline.isnot(None))
        .filter(Complaint.sla_deadline < now)
        .scalar() or 0
    )

    # Average resolution time in hours for resolved/closed complaints
    resolved_complaints = (
        db.query(Complaint)
        .filter(
            (Complaint.resolved_at.isnot(None)) | (Complaint.closed_at.isnot(None))
        )
        .all()
    )
    avg_hours = None
    if resolved_complaints:
        durations = []
        for c in resolved_complaints:
            end_time = c.closed_at or c.resolved_at
            if end_time and c.created_at:
                diff_hours = (end_time - c.created_at).total_seconds() / 3600.0
                if diff_hours >= 0:
                    durations.append(diff_hours)
        if durations:
            avg_hours = round(sum(durations) / len(durations), 2)

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
        "unresolved": unresolved_count,
        "sla_breached": sla_breached_count,
        "average_resolution_hours": avg_hours,
        "by_department": by_department,
        "by_severity": by_severity,
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
