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
    summary="[Scaffold] Check SLA deadlines and trigger follow-up/escalation",
    status_code=status.HTTP_200_OK,
)
def run_sla_check(
    db: Session = Depends(get_db),
):
    """
    Scaffold for periodic SLA monitoring.
    Full background scheduling and automatic escalation belongs to Milestone 2.
    """
    return {
        "checked": 0,
        "breached": 0,
        "actions_taken": [],
        "message": "SLA check monitor scaffold ready (scheduled for Milestone 2)",
    }


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
    
    NOTE: In Milestone 1, this returns deterministic stub data.
    In Milestone 2, this will route directly to Faik's AI Agent Brain in ai-agent/.
    """
    result = ai_service.analyze_complaint(
        complaint_id=payload.complaint_id,
        description=payload.description,
        image_url=payload.image_url,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    return result
