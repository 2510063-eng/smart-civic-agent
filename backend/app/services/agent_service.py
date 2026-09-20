"""
Agent Service

Provides audit logging and agentic action tracking across the complaint lifecycle:
PERCEIVE -> REASON -> DECIDE -> ACT -> OBSERVE -> FOLLOW UP -> ESCALATE -> VERIFY
"""

from typing import Optional, List
from sqlalchemy.orm import Session
from app.models import AgentAction, AgentActionType


def record_agent_action(
    db: Session,
    complaint_id: str,
    action_type: str,
    description: Optional[str] = None,
    status: str = "SUCCESS",
    agent: str = "CivicResolutionAgent",
    reason: Optional[str] = None,
    result: Optional[str] = None,
) -> AgentAction:
    """
    Records an agent action/decision into the audit timeline in SQLite.
    """
    action_record = AgentAction(
        complaint_id=complaint_id,
        action_type=action_type,
        action=action_type,  # alias for contract compatibility
        agent=agent,
        description=description,
        reason=reason or description,
        result=result,
        status=status,
    )
    db.add(action_record)
    db.commit()
    db.refresh(action_record)
    return action_record


def get_actions_by_complaint(
    db: Session,
    complaint_id: str,
) -> List[AgentAction]:
    """
    Retrieves the complete agent action history for a given complaint.
    """
    return (
        db.query(AgentAction)
        .filter(AgentAction.complaint_id == complaint_id)
        .order_by(AgentAction.created_at.asc())
        .all()
    )
