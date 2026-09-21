
# AI Agent Integration Contract

## Purpose

The AI Agent analyzes a citizen civic complaint and returns structured
information that the backend workflow can use to create, route, and
prioritize a complaint.

## Input

The analyzer accepts:

- complaint text
- optional image
- optional location

Example:

{
    "text": "There is a large pothole on the main road.",
    "image": null,
    "location": {
        "latitude": 16.7050,
        "longitude": 74.2433
    }
}

## AI Output

The AI Agent returns:

{
    "issue_type": "POTHOLE",
    "description": "There is a large pothole on the main road.",
    "severity": "HIGH",
    "severity_reason": "A large pothole may create a safety risk for vehicles and two-wheelers.",
    "location": {
        "latitude": 16.705,
        "longitude": 74.2433
    },
    "department": "ROADS",
    "evidence_quality": "FAIR",
    "duplicate_candidates": [],
    "recommended_action": "Inspect the reported location and repair the pothole.",
    "confidence": 0.94
}

## Workflow Usage

The backend workflow can use the AI output as follows:

1. issue_type → classify the complaint
2. severity → assign priority
3. department → route to responsible department
4. location → identify complaint location
5. recommended_action → suggest the next action
6. confidence → identify uncertain AI decisions
7. duplicate_candidates → check related complaints
8. evidence_quality → evaluate available evidence

## Important Rule

The AI Agent recommends decisions.

The backend workflow performs the actual actions such as:

- creating the complaint
- assigning the department
- setting SLA
- monitoring status
- sending follow-ups
- escalating unresolved complaints

The AI Agent must not fabricate addresses or missing information.

## Current Model Status

The current DemoModelClient is used only for development and testing.

It will later be replaceable with a production AI model without changing
the analyzer interface.
