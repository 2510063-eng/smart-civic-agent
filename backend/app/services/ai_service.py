"""
AI Service Interface & Adapter Stub

INTEGRATION CONTRACT FOR AI BRAIN (Faik / ai-agent/):
---------------------------------------------------
This module defines the integration boundary connecting the FastAPI Backend to Faik's AI Brain.

Expected structured AI analysis output:
- complaint_id: str
- issue_type: str (e.g. 'POTHOLE', 'GARBAGE', 'WATER_LEAKAGE', 'STREET_LIGHT', 'DRAINAGE', 'OTHER')
- severity: str ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
- priority: str ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
- severity_score: float (0.0 to 1.0)
- department: str ('ROAD_DEPARTMENT', 'SOLID_WASTE_MANAGEMENT', 'WATER_SUPPLY', 'ELECTRICAL_DEPARTMENT', 'DRAINAGE_DEPARTMENT', 'GENERAL')
- confidence: float (0.0 to 1.0)
- reason: str (Explainable reasoning behind classification & severity)
- evidence: list[str] (Bullet points of visual/textual evidence observed)
- is_stub: bool (False if real AI brain processed it, True if stubbed)

When Faik's AI Brain is ready, he can either:
1. Call `register_ai_brain_analyzer(my_fn)` and `register_ai_brain_verifier(my_fn)`.
2. Or replace the body of `AIServiceAdapter._default_stub_analyzer` and `AIServiceAdapter._default_stub_verifier`.
"""

import json
from typing import Optional, Dict, Any, List, Callable

# Global hooks for external AI Brain integration
_ai_brain_analyzer: Optional[Callable[..., Dict[str, Any]]] = None
_ai_brain_verifier: Optional[Callable[..., Dict[str, Any]]] = None


def register_ai_brain_analyzer(analyzer_fn: Callable[..., Dict[str, Any]]) -> None:
    """
    Hook allowing Faik's AI Brain to register its production analysis pipeline
    without modifying API route handlers or database code.
    """
    global _ai_brain_analyzer
    _ai_brain_analyzer = analyzer_fn


def register_ai_brain_verifier(verifier_fn: Callable[..., Dict[str, Any]]) -> None:
    """
    Hook allowing Faik's AI Brain to register its production Before/After
    verification pipeline.
    """
    global _ai_brain_verifier
    _ai_brain_verifier = verifier_fn


class AIServiceAdapter:
    """
    Adapter interface connecting the Backend to the AI Agent Brain.
    """

    @classmethod
    def analyze_complaint(
        cls,
        complaint_id: str,
        description: str,
        image_url: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Main entrypoint for AI issue classification, severity assessment,
        and department routing.
        
        If an external AI Brain is registered, delegates to it.
        Otherwise, runs the deterministic heuristic adapter stub.
        """
        if _ai_brain_analyzer is not None:
            try:
                result = _ai_brain_analyzer(
                    complaint_id=complaint_id,
                    description=description,
                    image_url=image_url,
                    latitude=latitude,
                    longitude=longitude,
                )
                if isinstance(result, dict):
                    result.setdefault("is_stub", False)
                    return result
            except Exception as e:
                # Fail gracefully to stub fallback if AI service errors
                pass

        return cls._default_stub_analyzer(
            complaint_id=complaint_id,
            description=description,
            image_url=image_url,
            latitude=latitude,
            longitude=longitude,
        )

    @classmethod
    def verify_resolution(
        cls,
        complaint_id: str,
        before_image_url: Optional[str],
        after_image_url: str,
    ) -> Dict[str, Any]:
        """
        Main entrypoint for AI Before/After resolution verification.
        
        If an external AI Brain is registered, delegates to it.
        Otherwise, runs the deterministic heuristic verification stub.
        """
        if _ai_brain_verifier is not None:
            try:
                result = _ai_brain_verifier(
                    complaint_id=complaint_id,
                    before_image_url=before_image_url,
                    after_image_url=after_image_url,
                )
                if isinstance(result, dict):
                    result.setdefault("is_stub", False)
                    return result
            except Exception:
                pass

        return cls._default_stub_verifier(
            complaint_id=complaint_id,
            before_image_url=before_image_url,
            after_image_url=after_image_url,
        )

    @staticmethod
    def _default_stub_analyzer(
        complaint_id: str,
        description: str,
        image_url: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Deterministic heuristic stub for development and testing.
        Clearly flagged as 'is_stub: True'.
        """
        desc_lower = description.lower()

        if "drain" in desc_lower or "sewage" in desc_lower or "overflow" in desc_lower:
            issue_type = "DRAINAGE"
            department = "DRAINAGE_DEPARTMENT"
            severity = "HIGH"
            priority = "HIGH"
            severity_score = 0.78
            reasoning = "STUB: Detected drainage/sewage overflow keywords in description."
            evidence = [
                "STUB: Drainage blockage or overflow reported",
                "STUB: Public health and hygiene hazard",
            ]
        elif "water" in desc_lower or "leak" in desc_lower or "pipe" in desc_lower:
            issue_type = "WATER_LEAKAGE"
            department = "WATER_SUPPLY"
            severity = "HIGH"
            priority = "HIGH"
            severity_score = 0.80
            reasoning = "STUB: Detected water leakage keywords in description."
            evidence = [
                "STUB: Pipeline leakage keywords detected",
                "STUB: Potential water wastage and localized road damage",
            ]
        elif "garbage" in desc_lower or "trash" in desc_lower or "waste" in desc_lower or "dump" in desc_lower:
            issue_type = "GARBAGE"
            department = "SOLID_WASTE_MANAGEMENT"
            severity = "MEDIUM"
            priority = "MEDIUM"
            severity_score = 0.60
            reasoning = "STUB: Detected waste/garbage keywords in description."
            evidence = [
                "STUB: Solid waste accumulation keyword matched",
                "STUB: Requires sanitation truck and cleanup squad",
            ]
        elif "light" in desc_lower or "lamp" in desc_lower or "dark" in desc_lower:
            issue_type = "STREET_LIGHT"
            department = "ELECTRICAL_DEPARTMENT"
            severity = "LOW"
            priority = "LOW"
            severity_score = 0.35
            reasoning = "STUB: Detected street light keywords in description."
            evidence = [
                "STUB: Street lighting malfunction keywords matched",
            ]
        elif "pothole" in desc_lower or "road" in desc_lower or "crater" in desc_lower or "asphalt" in desc_lower:
            issue_type = "POTHOLE"
            department = "ROAD_DEPARTMENT"
            severity = "HIGH"
            priority = "HIGH"
            severity_score = 0.85
            reasoning = "STUB: Detected road/pothole keywords in citizen report description."
            evidence = [
                "STUB: Road surface damage keyword matched in text",
                "STUB: Road hazard poses safety risk for two-wheelers and traffic",
            ]
        else:
            issue_type = "OTHER"
            department = "GENERAL"
            severity = "LOW"
            priority = "LOW"
            severity_score = 0.20
            reasoning = "STUB: Unclassified issue type. Defaulting to general civic administration."
            evidence = ["STUB: Generic civic issue description without distinct category match"]

        return {
            "complaint_id": complaint_id,
            "issue_type": issue_type,
            "severity": severity,
            "priority": priority,
            "severity_score": severity_score,
            "department": department,
            "confidence": 0.50,  # Explicitly stub confidence
            "reason": reasoning,
            "reasoning": reasoning,
            "evidence": evidence,
            "is_stub": True,
        }

    @staticmethod
    def _default_stub_verifier(
        complaint_id: str,
        before_image_url: Optional[str],
        after_image_url: str,
    ) -> Dict[str, Any]:
        """
        Deterministic stub for Before/After verification.
        Supports testing both PASSED and FAILED paths based on image keyword.
        """
        if after_image_url and ("fail" in after_image_url.lower() or "unresolved" in after_image_url.lower()):
            return {
                "complaint_id": complaint_id,
                "verification": "FAILED",
                "confidence": 0.82,
                "reason": "STUB: Road damage or civic defect is still visible in verification image.",
                "next_status": "REOPENED",
                "is_stub": True,
            }

        return {
            "complaint_id": complaint_id,
            "verification": "PASSED",
            "confidence": 0.91,
            "reason": "STUB: After-image shows repaired civic infrastructure.",
            "next_status": "CLOSED",
            "is_stub": True,
        }


# Convenience module-level aliases
analyze_complaint = AIServiceAdapter.analyze_complaint
verify_resolution = AIServiceAdapter.verify_resolution

