
"""
AI Analyzer for Smart Civic Issue Resolution.

This module prepares civic complaint data for AI analysis.
"""

from ai_agent.prompts import SYSTEM_PROMPT


def analyze_complaint(text, image=None, location=None, model_client=None):
    """
    Analyze a civic complaint using an AI model client.

    Parameters:
        text: Citizen's complaint text.
        image: Optional image of the civic issue.
        location: Optional location information.
        model_client: AI model client used for analysis.

    Returns:
        Structured AI analysis.
    """

    if not text and image is None:
        raise ValueError("Complaint text or image is required.")

    if model_client is None:
        raise ValueError("AI model client is required.")

    result = model_client.analyze(
        system_prompt=SYSTEM_PROMPT,
        text=text,
        image=image,
        location=location
    )

    return result
