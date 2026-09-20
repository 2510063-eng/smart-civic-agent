import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class ComplaintStatus(str, enum.Enum):
    NEW = "NEW"
    ANALYZING = "ANALYZING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    SLA_BREACH = "SLA_BREACH"
    FOLLOW_UP = "FOLLOW_UP"
    ESCALATED = "ESCALATED"
    RESOLVED = "RESOLVED"
    VERIFICATION = "VERIFICATION"
    CLOSED = "CLOSED"
    REOPENED = "REOPENED"


class SeverityLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class Department(str, enum.Enum):
    ROAD_DEPARTMENT = "ROAD_DEPARTMENT"
    SOLID_WASTE_MANAGEMENT = "SOLID_WASTE_MANAGEMENT"
    WATER_SUPPLY = "WATER_SUPPLY"
    ELECTRICAL_DEPARTMENT = "ELECTRICAL_DEPARTMENT"
    DRAINAGE_DEPARTMENT = "DRAINAGE_DEPARTMENT"
    GENERAL = "GENERAL"


class IssueType(str, enum.Enum):
    POTHOLE = "POTHOLE"
    GARBAGE = "GARBAGE"
    WATER_LEAKAGE = "WATER_LEAKAGE"
    STREET_LIGHT = "STREET_LIGHT"
    DRAINAGE = "DRAINAGE"
    OTHER = "OTHER"


class AgentActionType(str, enum.Enum):
    COMPLAINT_RECEIVED = "COMPLAINT_RECEIVED"
    CLASSIFY_ISSUE = "CLASSIFY_ISSUE"
    ASSIGN_DEPARTMENT = "ASSIGN_DEPARTMENT"
    SLA_CHECK = "SLA_CHECK"
    FOLLOW_UP = "FOLLOW_UP"
    ESCALATE = "ESCALATE"
    RESOLVE_SUBMITTED = "RESOLVE_SUBMITTED"
    VERIFY_RESOLUTION = "VERIFY_RESOLUTION"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String(50), unique=True, index=True, nullable=False)
    citizen_id = Column(String(50), nullable=True, default="CIT001")
    title = Column(String(200), nullable=True)
    description = Column(Text, nullable=False)

    # Classification & AI fields (can be populated later by AI Brain)
    issue_type = Column(String(50), nullable=True)
    severity = Column(String(20), nullable=True)
    priority = Column(String(20), nullable=True)
    severity_score = Column(Float, nullable=True)
    department = Column(String(100), nullable=True)
    confidence = Column(Float, nullable=True)
    reason = Column(Text, nullable=True)
    evidence = Column(Text, nullable=True)  # JSON-encoded array of evidence strings

    # Evidence & Location
    image_url = Column(String(500), nullable=True)
    voice_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(300), nullable=True)
    location_text = Column(String(300), nullable=True)

    # Lifecycle & Timestamps
    status = Column(String(30), default=ComplaintStatus.ANALYZING.value, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    sla_due_at = Column(DateTime, nullable=True)
    sla_deadline = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)

    # Relationships
    actions = relationship("AgentAction", back_populates="complaint", cascade="all, delete-orphan")


class AgentAction(Base):
    __tablename__ = "agent_actions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String(50), ForeignKey("complaints.complaint_id"), index=True, nullable=False)
    action_type = Column(String(50), nullable=False)
    action = Column(String(50), nullable=True)  # alias for action_type per API contract
    agent = Column(String(100), default="CivicResolutionAgent", nullable=False)
    description = Column(Text, nullable=True)
    reason = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    status = Column(String(30), default="SUCCESS", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    complaint = relationship("Complaint", back_populates="actions")
