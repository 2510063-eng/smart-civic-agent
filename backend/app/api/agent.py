"""
Agent & Admin API Routes

Endpoints:
- GET /api/agent/actions/{complaint_id} : Chronological agent action history
- GET /api/admin/stats : Aggregated dashboard statistics
- POST /api/agent/sla-check : [Scaffold] SLA monitor check
- POST /api/ai/analyze : [Adapter] Connects to ai_service stub
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import ComplaintStatus
from app.schemas import (
    AgentActionResponse,
    AgentActionHistoryResponse,
    AdminStatsResponse,
    SLACheckResponse,
    FollowUpRequest,
    FollowUpResponse,
    EscalateRequest,
    EscalateResponse,
    AIAnalyzeRequest,
    AIAnalyzeResponse,
    ComplaintProcessResponse,
    ComplaintResponse,
    ErrorResponse,
)
from app.services import agent_service, complaint_service, ai_service

router = APIRouter(tags=["Agent & Admin"])


@router.get(
    "/agent/actions/{complaint_id}",
    response_model=AgentActionHistoryResponse,
    summary="Get agent action history for a complaint",
    responses={
        200: {"model": AgentActionHistoryResponse, "description": "Agent action timeline"},
        404: {"model": ErrorResponse, "description": "Complaint not found"},
    },
)
def get_agent_actions(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    """
    Returns the complete chronological audit log of actions taken by the agent
    for a given complaint (e.g. COMPLAINT_RECEIVED, CLASSIFY_ISSUE, ASSIGN_DEPARTMENT, etc.).
    """
    # Verify complaint exists
    complaint = complaint_service.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": f"Complaint '{complaint_id}' not found",
                "code": "COMPLAINT_NOT_FOUND",
            },
        )

    actions = agent_service.get_actions_by_complaint(db, complaint_id)
    actions_out = [AgentActionResponse.model_validate(a) for a in actions]

    return AgentActionHistoryResponse(
        complaint_id=complaint_id,
        actions=actions_out,
    )


@router.get(
    "/admin/stats",
    response_model=AdminStatsResponse,
    summary="Get aggregated civic issue statistics",
)
def get_admin_stats(
    db: Session = Depends(get_db),
):
    """
    Returns aggregate complaint counts across all lifecycle states for the Admin Dashboard.
    """
    stats_data = complaint_service.get_admin_stats(db)
    return AdminStatsResponse(**stats_data)


@router.post(
    "/agent/sla-check",
    response_model=SLACheckResponse,
    summary="Check SLA deadlines and trigger follow-up/escalation",
    status_code=status.HTTP_200_OK,
)
def run_sla_check(
    db: Session = Depends(get_db),
):
    """
    Periodic SLA monitoring engine:
    - Identifies active complaints whose SLA deadline has passed.
    - Evaluates priority/history:
      - Critical or already reminded -> ESCALATE.
      - First breach -> FOLLOW_UP.
    - Records AgentAction for every autonomous decision.
    """
    result = complaint_service.check_sla_and_process(db)
    return SLACheckResponse(**result)


@router.post(
    "/agent/follow-up",
    response_model=FollowUpResponse,
    summary="Trigger follow-up for a complaint",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"model": FollowUpResponse, "description": "Follow-up initiated"},
        400: {"model": ErrorResponse, "description": "Missing complaint_id"},
        404: {"model": ErrorResponse, "description": "Complaint not found"},
    },
)
def trigger_follow_up(
    payload: FollowUpRequest,
    db: Session = Depends(get_db),
):
    """
    Triggers an autonomous or manual follow-up reminder for an unresolved complaint.
    Updates status to 'FOLLOW_UP' and records action in audit timeline.
    """
    if not payload.complaint_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "complaint_id is required in request body", "code": "MISSING_COMPLAINT_ID"},
        )
    existing = complaint_service.get_complaint_by_id(db, payload.complaint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{payload.complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
        )
    if existing.status == ComplaintStatus.CLOSED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": f"Cannot follow up on complaint '{payload.complaint_id}' because it is already CLOSED.", "code": "ALREADY_CLOSED"},
        )

    complaint = complaint_service.follow_up_complaint(
        db=db,
        complaint_id=payload.complaint_id,
        reason=payload.reason,
    )
    return FollowUpResponse(
        complaint_id=complaint.complaint_id,
        action="FOLLOW_UP",
        status=complaint.status,
        message="Follow-up initiated",
    )


@router.post(
    "/agent/follow-up/{complaint_id}",
    response_model=FollowUpResponse,
    summary="Trigger follow-up for a complaint by ID path",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"model": FollowUpResponse, "description": "Follow-up initiated"},
        400: {"model": ErrorResponse, "description": "Invalid operation on closed complaint"},
        404: {"model": ErrorResponse, "description": "Complaint not found"},
    },
)
def trigger_follow_up_by_id(
    complaint_id: str,
    payload: Optional[FollowUpRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Triggers follow-up for a complaint specified via URL path.
    """
    existing = complaint_service.get_complaint_by_id(db, complaint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
        )
    if existing.status == ComplaintStatus.CLOSED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": f"Cannot follow up on complaint '{complaint_id}' because it is already CLOSED.", "code": "ALREADY_CLOSED"},
        )

    reason = payload.reason if payload else "Complaint has not been updated within SLA"
    complaint = complaint_service.follow_up_complaint(
        db=db,
        complaint_id=complaint_id,
        reason=reason,
    )
    return FollowUpResponse(
        complaint_id=complaint.complaint_id,
        action="FOLLOW_UP",
        status=complaint.status,
        message="Follow-up initiated",
    )


@router.post(
    "/agent/escalate",
    response_model=EscalateResponse,
    summary="Trigger escalation for a complaint",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"model": EscalateResponse, "description": "Escalation initiated"},
        400: {"model": ErrorResponse, "description": "Missing complaint_id or invalid operation"},
        404: {"model": ErrorResponse, "description": "Complaint not found"},
    },
)
def trigger_escalate(
    payload: EscalateRequest,
    db: Session = Depends(get_db),
):
    """
    Escalates an unresolved complaint due to SLA breach or severe priority.
    Updates status to 'ESCALATED' and records action in audit timeline.
    """
    if not payload.complaint_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "complaint_id is required in request body", "code": "MISSING_COMPLAINT_ID"},
        )
    existing = complaint_service.get_complaint_by_id(db, payload.complaint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{payload.complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
        )
    if existing.status == ComplaintStatus.CLOSED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": f"Cannot escalate complaint '{payload.complaint_id}' because it is already CLOSED.", "code": "ALREADY_CLOSED"},
        )

    complaint = complaint_service.escalate_complaint(
        db=db,
        complaint_id=payload.complaint_id,
        reason=payload.reason,
    )
    return EscalateResponse(
        complaint_id=complaint.complaint_id,
        action="ESCALATE",
        status=complaint.status,
        message="Complaint escalated to higher authority",
    )


@router.post(
    "/agent/escalate/{complaint_id}",
    response_model=EscalateResponse,
    summary="Trigger escalation for a complaint by ID path",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"model": EscalateResponse, "description": "Escalation initiated"},
        400: {"model": ErrorResponse, "description": "Invalid operation on closed complaint"},
        404: {"model": ErrorResponse, "description": "Complaint not found"},
    },
)
def trigger_escalate_by_id(
    complaint_id: str,
    payload: Optional[EscalateRequest] = None,
    db: Session = Depends(get_db),
):
    """
    Escalates a complaint specified via URL path.
    """
    existing = complaint_service.get_complaint_by_id(db, complaint_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
        )
    if existing.status == ComplaintStatus.CLOSED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": f"Cannot escalate complaint '{complaint_id}' because it is already CLOSED.", "code": "ALREADY_CLOSED"},
        )

    reason = payload.reason if payload else "SLA breached without resolution"
    complaint = complaint_service.escalate_complaint(
        db=db,
        complaint_id=complaint_id,
        reason=reason,
    )
    return EscalateResponse(
        complaint_id=complaint.complaint_id,
        action="ESCALATE",
        status=complaint.status,
        message="Complaint escalated to higher authority",
    )


@router.post(
    "/ai/analyze",
    response_model=AIAnalyzeResponse,
    summary="[Adapter] Submit complaint to AI Brain adapter stub",
    status_code=status.HTTP_200_OK,
)
def analyze_complaint_adapter(
    payload: AIAnalyzeRequest,
):
    """
    Adapter endpoint that routes to ai_service.AIServiceAdapter.
    
    Returns structured AI analysis result:
    - issue_type, severity, priority, severity_score, department, confidence, reason, evidence, is_stub.
    
    When Faik integrates ai-agent/, this routes directly to the AI Brain.
    """
    result = ai_service.analyze_complaint(
        complaint_id=payload.complaint_id,
        description=payload.description,
        image_url=payload.image_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    return AIAnalyzeResponse(**result)


@router.post(
    "/agent/process/{complaint_id}",
    response_model=ComplaintProcessResponse,
    summary="Agent triggers autonomous complaint processing",
    status_code=status.HTTP_200_OK,
    responses={
        200: {"model": ComplaintProcessResponse, "description": "Complaint processed"},
        404: {"model": ErrorResponse, "description": "Complaint not found"},
    },
)
def agent_process_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    """
    Agent orchestration endpoint for autonomous complaint processing.
    Runs AI analysis, sets dynamic SLA, transitions to ASSIGNED, and logs audit actions.
    """
    complaint, actions_logged = complaint_service.process_complaint_with_ai(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
        )

    complaint_out = ComplaintResponse.model_validate(complaint)
    return ComplaintProcessResponse(
        complaint_id=complaint.complaint_id,
        status=complaint.status,
        issue_type=complaint.issue_type,
        severity=complaint.severity,
        priority=complaint.priority,
        department=complaint.department,
        sla_deadline=complaint.sla_deadline,
        actions_logged=actions_logged,
        message="Complaint processed and routed to department",
        complaint=complaint_out,
    )
