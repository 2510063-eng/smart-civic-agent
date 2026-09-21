
"""
Demo AI model client for testing the civic issue analyzer.

This simulates the structured output that a real AI model
such as Gemini can provide.
"""


class DemoModelClient:

    def analyze(self, system_prompt, text, image=None, location=None):

        text_lower = (text or "").lower()

        # Simple demo classification
        if "pothole" in text_lower:
            issue_type = "POTHOLE"
            severity = "HIGH"
            severity_reason = (
                "A large pothole may create a safety risk for vehicles "
                "and two-wheelers."
            )
            department = "ROADS"
            recommended_action = (
                "Inspect the reported location and repair the pothole."
            )
            confidence = 0.94

        elif "garbage" in text_lower:
            issue_type = "GARBAGE"
            severity = "MEDIUM"
            severity_reason = (
                "Accumulated garbage may create sanitation and public "
                "health concerns."
            )
            department = "SANITATION"
            recommended_action = (
                "Inspect the location and arrange garbage collection."
            )
            confidence = 0.91

        elif "streetlight" in text_lower or "light" in text_lower:
            issue_type = "STREETLIGHT"
            severity = "MEDIUM"
            severity_reason = (
                "A non-functioning streetlight can reduce visibility "
                "and create a public safety concern."
            )
            department = "ELECTRICAL"
            recommended_action = (
                "Inspect and repair the streetlight."
            )
            confidence = 0.90

        else:
            issue_type = "OTHER"
            severity = "LOW"
            severity_reason = "The reported issue could not be clearly classified."
            department = "OTHER"
            recommended_action = "Inspect the reported issue."
            confidence = 0.60

        return {
            "issue_type": issue_type,
            "description": text,
            "severity": severity,
            "severity_reason": severity_reason,
            "location": location,
            "department": department,
            "evidence_quality": "FAIR" if image is None else "GOOD",
            "duplicate_candidates": [],
            "recommended_action": recommended_action,
            "confidence": confidence
        }
