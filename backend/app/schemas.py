from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Complaint Schemas
# ---------------------------------------------------------------------------

class ComplaintCreate(BaseModel):
    description: str = Field(..., min_length=3, description="Detailed description of the issue")
    title: Optional[str] = Field(None, description="Optional brief title")
    image_url: Optional[str] = Field(None, description="URL or upload path for evidence image")
    voice_url: Optional[str] = Field(None, description="Optional voice message recording URL")
    latitude: Optional[float] = Field(None, description="GPS latitude")
    longitude: Optional[float] = Field(None, description="GPS longitude")
    location_text: Optional[str] = Field(None, description="Human readable location or landmark")
    address: Optional[str] = Field(None, description="Civic address")
    citizen_id: Optional[str] = Field("CIT001", description="Citizen identifier")


class ComplaintResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: str
    citizen_id: Optional[str] = None
    title: Optional[str] = None
    description: str

    # AI / Agent fields
    issue_type: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    severity_score: Optional[float] = None
    department: Optional[str] = None
    confidence: Optional[float] = None
    reason: Optional[str] = None
    evidence: Optional[str] = None

    # Evidence & Location
    image_url: Optional[str] = None
    voice_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    location_text: Optional[str] = None

    # Status & Timestamps
    status: str
    created_at: datetime
    updated_at: datetime
    sla_due_at: Optional[datetime] = None
    sla_deadline: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None

    # Duplicate / Clustering fields
    duplicate_of: Optional[str] = None
    cluster_id: Optional[str] = None
    similarity_score: Optional[float] = None


class ComplaintCreatedResponse(BaseModel):
    complaint_id: str
    status: str
    message: str
    complaint: Optional[ComplaintResponse] = None


class ComplaintListResponse(BaseModel):
    complaints: List[ComplaintResponse]
    total: int


# ---------------------------------------------------------------------------
# Agent Action Schemas
# ---------------------------------------------------------------------------

class AgentActionCreate(BaseModel):
    complaint_id: str
    action_type: str
    description: Optional[str] = None
    reason: Optional[str] = None
    result: Optional[str] = None
    status: str = "SUCCESS"
    agent: str = "CivicResolutionAgent"


class AgentActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    complaint_id: str
    action_type: str
    action: Optional[str] = None
    agent: str
    description: Optional[str] = None
    reason: Optional[str] = None
    result: Optional[str] = None
    status: str
    created_at: datetime
    timestamp: Optional[datetime] = None


class AgentActionHistoryResponse(BaseModel):
    complaint_id: str
    actions: List[AgentActionResponse]


# ---------------------------------------------------------------------------
# Admin Dashboard Schemas
# ---------------------------------------------------------------------------

class AdminStatsResponse(BaseModel):
    total_complaints: int
    new: int
    analyzing: int
    assigned: int
    in_progress: int
    resolved: int
    escalated: int
    reopened: int
    closed: int
    unresolved: int = 0
    sla_breached: int = 0
    average_resolution_hours: Optional[float] = None
    by_department: Dict[str, int] = Field(default_factory=dict)
    by_severity: Dict[str, int] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Common / Error Responses
# ---------------------------------------------------------------------------

class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    code: str


# ---------------------------------------------------------------------------
# Workflow & Lifecycle Schemas
# ---------------------------------------------------------------------------

class StatusUpdateRequest(BaseModel):
    status: str = Field(..., description="Target lifecycle status")
    reason: Optional[str] = Field(None, description="Reason for status transition")


class StatusUpdateResponse(BaseModel):
    complaint_id: str
    status: str
    message: str


class ResolveRequest(BaseModel):
    resolution_description: str = Field(..., description="Description of the fix/resolution work done")
    after_image_url: Optional[str] = Field(None, description="URL/path of the resolution evidence photo")


class ResolveResponse(BaseModel):
    complaint_id: str
    status: str
    message: str


class VerifyRequest(BaseModel):
    after_image_url: Optional[str] = Field(None, description="URL/path of after image to verify against initial evidence")


class VerifyResponse(BaseModel):
    complaint_id: str
    verification: str
    confidence: float
    reason: str
    next_status: str


class SLAActionTaken(BaseModel):
    complaint_id: str
    action: str


class SLACheckResponse(BaseModel):
    checked: int
    breached: int
    actions_taken: List[SLAActionTaken]


class FollowUpRequest(BaseModel):
    complaint_id: Optional[str] = Field(None, description="Complaint ID if not provided in URL path")
    reason: Optional[str] = Field("Complaint has not been updated within SLA", description="Follow-up reason")


class FollowUpResponse(BaseModel):
    complaint_id: str
    action: str
    status: str
    message: str


class EscalateRequest(BaseModel):
    complaint_id: Optional[str] = Field(None, description="Complaint ID if not provided in URL path")
    reason: Optional[str] = Field("SLA breached without resolution", description="Escalation reason")


class EscalateResponse(BaseModel):
    complaint_id: str
    action: str
    status: str
    message: str


# ---------------------------------------------------------------------------
# AI Analysis & Integration Schemas
# ---------------------------------------------------------------------------

class AIAnalyzeRequest(BaseModel):
    complaint_id: str = Field(..., description="Complaint identifier")
    description: str = Field(..., min_length=3, description="Issue description for classification")
    image_url: Optional[str] = Field(None, description="Evidence image URL")
    latitude: Optional[float] = Field(None, description="Location latitude")
    longitude: Optional[float] = Field(None, description="Location longitude")


class AIAnalyzeResponse(BaseModel):
    complaint_id: str
    issue_type: str
    severity: str
    priority: str
    severity_score: float
    department: str
    confidence: float
    reason: str
    reasoning: Optional[str] = None
    evidence: List[str] = Field(default_factory=list)
    is_stub: bool = True


class ComplaintProcessResponse(BaseModel):
    complaint_id: str
    status: str
    issue_type: Optional[str] = None
    severity: Optional[str] = None
    priority: Optional[str] = None
    department: Optional[str] = None
    sla_deadline: Optional[datetime] = None
    actions_logged: List[str] = Field(default_factory=list)
    message: str
    complaint: Optional[ComplaintResponse] = None


# ---------------------------------------------------------------------------
# Duplicate & Related Complaint Schemas
# ---------------------------------------------------------------------------

class RelatedComplaintItem(BaseModel):
    complaint_id: str
    issue_type: Optional[str] = None
    status: str
    similarity_score: float
    relationship: str = Field(..., description="'POTENTIAL_DUPLICATE' or 'RELATED_ISSUE'")
    distance_meters: Optional[float] = None
    time_difference_hours: Optional[float] = None
    reasons: List[str] = Field(default_factory=list)
    created_at: datetime


class RelatedComplaintsResponse(BaseModel):
    complaint_id: str
    total_related: int
    related_complaints: List[RelatedComplaintItem] = Field(default_factory=list)

