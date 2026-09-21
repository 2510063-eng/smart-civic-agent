
from ai_agent.analyzer import analyze_complaint
from ai_agent.demo_model import DemoModelClient


def test_pothole():
    model = DemoModelClient()

    result = analyze_complaint(
        text="There is a large pothole on the road.",
        location={"latitude": 16.7050, "longitude": 74.2433},
        model_client=model
    )

    assert result["issue_type"] == "POTHOLE"
    assert result["severity"] == "HIGH"
    assert result["department"] == "ROADS"
    assert 0 <= result["confidence"] <= 1


def test_garbage():
    model = DemoModelClient()

    result = analyze_complaint(
        text="Garbage is accumulated near the bus stop.",
        location={"latitude": 16.7050, "longitude": 74.2433},
        model_client=model
    )

    assert result["issue_type"] == "GARBAGE"
    assert result["severity"] == "MEDIUM"
    assert result["department"] == "SANITATION"
    assert 0 <= result["confidence"] <= 1


def test_streetlight():
    model = DemoModelClient()

    result = analyze_complaint(
        text="The streetlight is not working.",
        location={"latitude": 16.7050, "longitude": 74.2433},
        model_client=model
    )

    assert result["issue_type"] == "STREETLIGHT"
    assert result["department"] == "ELECTRICAL"
    assert 0 <= result["confidence"] <= 1


def test_empty_complaint():
    model = DemoModelClient()

    try:
        analyze_complaint(
            text="",
            location=None,
            model_client=model
        )
        assert False, "Empty complaint should raise ValueError"
    except ValueError:
        assert True
