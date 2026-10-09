import sys
import os
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

SAMPLE_IMAGE_DATA_URL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

class TestBackendAPI(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health_endpoint(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")

    def test_analyze_crop_end_to_end_schema(self):
        payload = {
            "userId": "test-user-123",
            "imageDataUrl": SAMPLE_IMAGE_DATA_URL,
            "textDescription": "Yellowing leaf margins with brown spots on paddy",
            "transcription": "I noticed leaf yellowing starting 3 days ago",
            "language": "en",
            "cropType": "rice"
        }

        response = self.client.post("/api/analyze", json=payload)
        self.assertEqual(response.status_code, 200, f"Analysis failed with response: {response.text}")

        res_json = response.json()

        # Schema Validation according to src/types/index.ts
        self.assertIn("id", res_json)
        self.assertEqual(res_json["userId"], "test-user-123")
        self.assertEqual(res_json["cropType"], "rice")
        self.assertIn("possible_causes", res_json)
        self.assertIsInstance(res_json["possible_causes"], list)
        self.assertGreater(len(res_json["possible_causes"]), 0)

        # Validate PossibleCause fields
        first_cause = res_json["possible_causes"][0]
        self.assertIn("id", first_cause)
        self.assertIn("name", first_cause)
        self.assertIn("category", first_cause)
        self.assertIn(first_cause["category"], ["disease", "pest", "nutrient", "environmental", "physiological"])
        self.assertIn("likelihood", first_cause)
        self.assertIn(first_cause["likelihood"], ["high", "medium", "low"])
        self.assertIn("symptoms", first_cause)

        # Validate Confidence & Escalation fields
        self.assertIn("confidence_level", res_json)
        self.assertIn(res_json["confidence_level"], ["high", "medium", "low"])
        self.assertIn("confidenceNarrative", res_json)
        self.assertIn("escalation_flag", res_json)
        self.assertIsInstance(res_json["escalation_flag"], bool)

        # Validate Evidence Sources & Action Plan
        self.assertIn("sources", res_json)
        self.assertIsInstance(res_json["sources"], list)
        self.assertIn("action_plan", res_json)
        self.assertIsInstance(res_json["action_plan"], list)
        self.assertGreater(len(res_json["action_plan"]), 0)

        first_action = res_json["action_plan"][0]
        self.assertIn("id", first_action)
        self.assertIn("step", first_action)
        self.assertIn("title", first_action)
        self.assertIn("priority", first_action)
        self.assertIn(first_action["priority"], ["immediate", "short-term", "preventive"])

        # Validate summary & createdAt
        self.assertIn("summary", res_json)
        self.assertIn("createdAt", res_json)

    def test_analyze_crop_missing_input_validation(self):
        payload = {
            "userId": "test-user-empty",
            "language": "en"
        }
        response = self.client.post("/api/analyze", json=payload)
        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.json())

    def test_history_endpoint(self):
        response = self.client.get("/api/history?userId=test-user-123")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_weather_endpoint(self):
        response = self.client.get("/api/weather?location=Ludhiana")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("temperature", data)
        self.assertIn("humidity", data)
        self.assertIn("condition", data)

    def test_dynamic_rag_responses_per_crop(self):
        """Tests that different inputs yield distinct, dynamic, RAG-backed diagnoses."""
        test_cases = [
            {
                "cropType": "maize",
                "textDescription": "Ragged holes in central leaf whorls with sawdust frass",
                "expected_name_keyword": "Armyworm"
            },
            {
                "cropType": "wheat",
                "textDescription": "Yellow stripe rust pustules along leaf veins releasing yellow powder",
                "expected_name_keyword": "Rust"
            },
            {
                "cropType": "cotton",
                "textDescription": "Whiteflies under cotton leaves with sticky honeydew and leaf curl",
                "expected_name_keyword": "Whitefly"
            },
            {
                "cropType": "potato",
                "textDescription": "Rotting potato tubers with foul odor and slimy decay",
                "expected_name_keyword": "Soft Rot"
            },
            {
                "cropType": "sugarcane",
                "textDescription": "Sugarcane stalk split shows red tissue with white spots and sour alcoholic odor",
                "expected_name_keyword": "Red Rot"
            }
        ]

        for tc in test_cases:
            payload = {
                "userId": "rag-test-user",
                "textDescription": tc["textDescription"],
                "language": "en",
                "cropType": tc["cropType"]
            }
            res = self.client.post("/api/analyze", json=payload)
            self.assertEqual(res.status_code, 200)
            data = res.json()
            primary_cause_name = data["possible_causes"][0]["name"]
            self.assertIn(
                tc["expected_name_keyword"].lower(),
                primary_cause_name.lower(),
                f"Expected keyword '{tc['expected_name_keyword']}' in primary cause name '{primary_cause_name}' for crop {tc['cropType']}"
            )

if __name__ == "__main__":
    unittest.main()

