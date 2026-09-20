
ISSUE_TYPES = [
    "POTHOLE",
    "GARBAGE",
    "STREETLIGHT",
    "WATER_LEAKAGE",
    "DRAINAGE",
    "ROAD_DAMAGE",
    "TRAFFIC_SIGNAL",
    "PUBLIC_INFRASTRUCTURE",
    "OTHER"
]

SEVERITY_LEVELS = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
]

DEPARTMENTS = [
    "ROADS",
    "SANITATION",
    "ELECTRICAL",
    "WATER_SUPPLY",
    "DRAINAGE",
    "TRAFFIC",
    "OTHER"
]

EVIDENCE_QUALITY = [
    "POOR",
    "FAIR",
    "GOOD"
]

AI_OUTPUT_FIELDS = [
    "issue_type",
    "description",
    "severity",
    "severity_reason",
    "location",
    "department",
    "evidence_quality",
    "duplicate_candidates",
    "recommended_action",
    "confidence"
]
