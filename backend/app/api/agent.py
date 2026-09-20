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
from app.schemas import (
    AgentActionResponse,
    AgentActionHistoryResponse,
    AdminStatsResponse,
    SLACheckResponse,
    FollowUpRequest,
    FollowUpResponse,
    EscalateRequest,
    EscalateResponse,
    ErrorResponse,
)
from app.services import agent_service, complaint_service, ai_service

router = APIRouter(tags=["Agent & Admin"])


class AIAnalyzeRequest(BaseModel):
    complaint_id: str = Field(..., description="Complaint identifier")
    description: str = Field(..., description="Issue description for classification")
    image_url: Optional[str] = Field(None, description="Evidence image URL")
    latitude: Optional[float] = Field(None, description="Location latitude")
    longitude: Optional[float] = Field(None, description="Location longitude")


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
    complaint = complaint_service.follow_up_complaint(
        db=db,
        complaint_id=payload.complaint_id,
        reason=payload.reason,
    )
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{payload.complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
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
    reason = payload.reason if payload else "Complaint has not been updated within SLA"
    complaint = complaint_service.follow_up_complaint(
        db=db,
        complaint_id=complaint_id,
        reason=reason,
    )
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
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
        400: {"model": ErrorResponse, "description": "Missing complaint_id"},
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
    complaint = complaint_service.escalate_complaint(
        db=db,
        complaint_id=payload.complaint_id,
        reason=payload.reason,
    )
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{payload.complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
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
    reason = payload.reason if payload else "SLA breached without resolution"
    complaint = complaint_service.escalate_complaint(
        db=db,
        complaint_id=complaint_id,
        reason=reason,
    )
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
        )
    return EscalateResponse(
        complaint_id=complaint.complaint_id,
        action="ESCALATE",
        status=complaint.status,
        message="Complaint escalated to higher authority",
    )


@router.post(
    "/ai/analyze",
    summary="[Adapter] Submit complaint to AI Brain adapter stub",
    status_code=status.HTTP_200_OK,
)
def analyze_complaint_adapter(
    payload: AIAnalyzeRequest,
):
    """
    Adapter endpoint that routes to ai_service.AIServiceAdapter.
    
    NOTE: In Milestone 1 & 2, this returns deterministic stub data.
    When Faik integrates ai-agent/, this routes directly to the AI Brain.
    """
    result = ai_service.analyze_complaint(
        complaint_id=payload.complaint_id,
        description=payload.description,
        image_url=payload.image_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    return result
