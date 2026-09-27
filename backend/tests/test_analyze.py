import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Sample base64 1x1 transparent PNG
SAMPLE_IMAGE_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"

def test_analyze_crop_end_to_end_schema():
    payload = {
        "userId": "test-user-123",
        "imageDataUrl": SAMPLE_IMAGE_DATA_URL,
        "textDescription": "Yellowing leaf margins with brown spots on paddy",
        "transcription": "I noticed leaf yellowing starting 3 days ago",
        "language": "en",
        "cropType": "rice"
    }

    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200, f"Analysis failed with response: {response.text}"

    res_json = response.json()

    # Schema Validation according to src/types/index.ts
    assert "id" in res_json
    assert res_json["userId"] == "test-user-123"
    assert res_json["cropType"] == "rice"
    assert "possible_causes" in res_json
    assert isinstance(res_json["possible_causes"], list)
    assert len(res_json["possible_causes"]) > 0

    # Validate PossibleCause fields
    first_cause = res_json["possible_causes"][0]
    assert "id" in first_cause
    assert "name" in first_cause
    assert "category" in first_cause
    assert first_cause["category"] in ["disease", "pest", "nutrient", "environmental", "physiological"]
    assert "likelihood" in first_cause
    assert first_cause["likelihood"] in ["high", "medium", "low"]
    assert "symptoms" in first_cause

    # Validate Confidence & Escalation fields
    assert "confidence_level" in res_json
    assert res_json["confidence_level"] in ["high", "medium", "low"]
    assert "confidenceNarrative" in res_json
    assert "escalation_flag" in res_json
    assert isinstance(res_json["escalation_flag"], bool)

    # Validate Evidence Sources & Action Plan
    assert "sources" in res_json
    assert isinstance(res_json["sources"], list)
    assert "action_plan" in res_json
    assert isinstance(res_json["action_plan"], list)
    assert len(res_json["action_plan"]) > 0

    first_action = res_json["action_plan"][0]
    assert "id" in first_action
    assert "step" in first_action
    assert "title" in first_action
    assert "priority" in first_action
    assert first_action["priority"] in ["immediate", "short-term", "preventive"]

    # Validate summary & createdAt
    assert "summary" in res_json
    assert "createdAt" in res_json

def test_analyze_crop_missing_input_validation():
    payload = {
        "userId": "test-user-empty",
        "language": "en"
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 400
    assert "detail" in response.json()
