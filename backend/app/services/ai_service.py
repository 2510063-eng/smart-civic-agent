"""
AI Service Interface & Adapter Stub

TEMPORARY ADAPTER / STUB:
-------------------------
This module defines the integration contract for Faik's AI Agent Brain (PS01 - ai-agent/).
It is currently a deterministic stub returning baseline placeholder structures.
Do NOT treat these outputs as real AI predictions.

When Faik's AI Agent Brain is ready, replace the body of `analyze_complaint` and
`verify_resolution` with calls to the actual vision / LLM pipeline.
"""

from typing import Optional, Dict, Any, List


class AIServiceAdapter:
    """
    Adapter interface connecting the Backend to the AI Agent Brain.
    """

    @staticmethod
    def analyze_complaint(
        complaint_id: str,
        description: str,
        image_url: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Stub interface for AI issue classification, severity assessment,
        and department routing.

        Returns mock placeholder data to allow pipeline testing without claiming accuracy.
        """
        # Simple heuristic stub purely for mock demonstration
        desc_lower = description.lower()

        if "pothole" in desc_lower or "road" in desc_lower:
            issue_type = "POTHOLE"
            department = "ROAD_DEPARTMENT"
            severity = "HIGH"
            priority = "HIGH"
            severity_score = 0.85
            reasoning = "STUB: Detected road/pothole keywords in citizen report description."
            evidence = ["STUB: Road surface damage keyword matched"]
        elif "garbage" in desc_lower or "trash" in desc_lower or "waste" in desc_lower:
            issue_type = "GARBAGE"
            department = "SOLID_WASTE_MANAGEMENT"
            severity = "MEDIUM"
            priority = "MEDIUM"
            severity_score = 0.60
            reasoning = "STUB: Detected waste/garbage keywords in description."
            evidence = ["STUB: Solid waste keywords detected"]
        elif "water" in desc_lower or "leak" in desc_lower:
            issue_type = "WATER_LEAKAGE"
            department = "WATER_SUPPLY"
            severity = "HIGH"
            priority = "HIGH"
            severity_score = 0.80
            reasoning = "STUB: Detected water leakage keywords in description."
            evidence = ["STUB: Pipeline leakage keywords detected"]
        elif "light" in desc_lower or "lamp" in desc_lower:
            issue_type = "STREET_LIGHT"
            department = "ELECTRICAL_DEPARTMENT"
            severity = "LOW"
            priority = "LOW"
            severity_score = 0.35
            reasoning = "STUB: Detected street light keywords in description."
            evidence = ["STUB: Street light keywords detected"]
        else:
            issue_type = "OTHER"
            department = "GENERAL"
            severity = "LOW"
            priority = "LOW"
            severity_score = 0.20
            reasoning = "STUB: Unclassified issue type. Defaulting to general department."
            evidence = ["STUB: Generic civic issue description"]

        return {
            "complaint_id": complaint_id,
            "issue_type": issue_type,
            "severity": severity,
            "priority": priority,
            "severity_score": severity_score,
            "department": department,
            "confidence": 0.50,  # Explicitly marked as low/stub confidence
            "reason": reasoning,
            "reasoning": reasoning,
            "evidence": evidence,
            "is_stub": True,
        }

    @staticmethod
    def verify_resolution(
        complaint_id: str,
        before_image_url: Optional[str],
        after_image_url: str,
    ) -> Dict[str, Any]:
        """
        Stub interface for AI Before/After resolution verification.
        Supports testing both PASSED and FAILED paths based on image keyword.
        """
        # Deterministic simulation for test verification
        if after_image_url and ("fail" in after_image_url.lower() or "unresolved" in after_image_url.lower()):
            return {
                "complaint_id": complaint_id,
                "verification": "FAILED",
                "confidence": 0.82,
                "reason": "STUB: Road damage or defect is still visible in verification image.",
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


# Convenience module-level functions
analyze_complaint = AIServiceAdapter.analyze_complaint
verify_resolution = AIServiceAdapter.verify_resolution
