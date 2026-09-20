"""
Complaint API Routes

Endpoints:
- POST /api/complaints : Ingest new citizen complaint and queue for analysis
- GET /api/complaints : List complaints with filtering and pagination
- GET /api/complaints/{complaint_id} : Retrieve full details of a single complaint
- POST /api/complaints/{complaint_id}/resolve : Scaffold for worker resolution
- POST /api/complaints/{complaint_id}/verify : Scaffold for resolution verification
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintCreatedResponse,
    ComplaintListResponse,
    ErrorResponse,
)
from app.services import complaint_service

router = APIRouter(prefix="/complaints", tags=["Complaints"])


@router.post(
    "",
    response_model=ComplaintCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new civic complaint",
    responses={
        201: {"model": ComplaintCreatedResponse, "description": "Complaint created successfully"},
        400: {"model": ErrorResponse, "description": "Validation error"},
    },
)
def create_complaint(
    payload: ComplaintCreate,
    db: Session = Depends(get_db),
):
    """
    Creates a new citizen complaint in SQLite.
    
    1. Validates citizen input (description, location, evidence).
    2. Initializes complaint with status 'ANALYZING'.
    3. Calculates initial SLA deadline.
    4. Records the initial 'COMPLAINT_RECEIVED' AgentAction audit log entry.
    5. Returns the complaint receipt according to the API contract.
    """
    new_complaint = complaint_service.create_complaint(db, payload)
    complaint_out = ComplaintResponse.model_validate(new_complaint)

    return ComplaintCreatedResponse(
        complaint_id=new_complaint.complaint_id,
        status=new_complaint.status,
        message="Complaint received successfully",
        complaint=complaint_out,
    )


@router.get(
    "",
    response_model=ComplaintListResponse,
    summary="List complaints with optional filters",
)
def list_complaints(
    status: Optional[str] = Query(None, description="Filter by status (e.g. ANALYZING, IN_PROGRESS, ESCALATED)"),
    department: Optional[str] = Query(None, description="Filter by department (e.g. ROAD_DEPARTMENT)"),
    severity: Optional[str] = Query(None, description="Filter by severity (e.g. HIGH, CRITICAL)"),
    limit: int = Query(50, ge=1, le=100, description="Max number of items to return"),
    offset: int = Query(0, ge=0, description="Number of items to skip"),
    db: Session = Depends(get_db),
):
    """
    Returns a list of civic complaints, ordered from newest to oldest.
    Supports filtering by status, department, and severity.
    """
    complaints = complaint_service.list_complaints(
        db=db,
        status=status,
        department=department,
        severity=severity,
        limit=limit,
        offset=offset,
    )
    complaints_out = [ComplaintResponse.model_validate(c) for c in complaints]
    return ComplaintListResponse(
        complaints=complaints_out,
        total=len(complaints_out),
    )


@router.get(
    "/{complaint_id}",
    response_model=ComplaintResponse,
    summary="Get single complaint details",
    responses={
        200: {"model": ComplaintResponse, "description": "Complaint details"},
        404: {"model": ErrorResponse, "description": "Complaint not found"},
    },
)
def get_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieves the full record of a complaint by its complaint_id (e.g. 'CMP001') or numeric ID.
    """
    complaint = complaint_service.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": f"Complaint '{complaint_id}' not found",
                "code": "COMPLAINT_NOT_FOUND",
            },
        )
    return ComplaintResponse.model_validate(complaint)


# ---------------------------------------------------------------------------
# Milestone 2 Scaffolding (Worker Resolution & Verification)
# ---------------------------------------------------------------------------

@router.post(
    "/{complaint_id}/resolve",
    summary="[Scaffold] Worker submits resolution proof",
    status_code=status.HTTP_200_OK,
)
def resolve_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    """
    Scaffold for Worker Resolution submission.
    Full implementation scheduled for Milestone 2.
    """
    complaint = complaint_service.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
        )
    return {
        "complaint_id": complaint_id,
        "status": "VERIFICATION",
        "message": "Resolution submitted for verification (Milestone 2 scaffold)",
        "milestone": "Milestone 2",
    }


@router.post(
    "/{complaint_id}/verify",
    summary="[Scaffold] Trigger AI resolution verification",
    status_code=status.HTTP_200_OK,
)
def verify_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
):
    """
    Scaffold for AI Before/After resolution verification.
    Full implementation scheduled for Milestone 2.
    """
    complaint = complaint_service.get_complaint_by_id(db, complaint_id)
    if not complaint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": f"Complaint '{complaint_id}' not found", "code": "COMPLAINT_NOT_FOUND"},
        )
    return {
        "complaint_id": complaint_id,
        "verification": "PASSED",
        "confidence": 0.50,
        "reason": "Scaffold: Visual comparison stub for Milestone 1",
        "next_status": "CLOSED",
        "milestone": "Milestone 2",
    }
