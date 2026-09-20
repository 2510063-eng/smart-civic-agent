"""
Backend API Test Suite for Milestone 1
"""

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        print("--- Testing /docs and /openapi.json ---")
        res_root = client.get("/")
        print("GET / :", res_root.status_code, res_root.json())
        assert res_root.status_code == 200

        res_docs = client.get("/docs")
        print("GET /docs :", res_docs.status_code)
        assert res_docs.status_code == 200

        res_openapi = client.get("/openapi.json")
        print("GET /openapi.json :", res_openapi.status_code, "Title:", res_openapi.json().get("info", {}).get("title"))
        assert res_openapi.status_code == 200

        print("\n--- Testing POST /api/complaints ---")
        payload = {
            "description": "Large dangerous pothole near the main road bus stop",
            "image_url": "uploads/pothole.jpg",
            "latitude": 16.7050,
            "longitude": 74.2433,
            "location_text": "Main road near central bus stop",
            "citizen_id": "CIT001"
        }
        res_post = client.post("/api/complaints", json=payload)
        print("POST /api/complaints :", res_post.status_code, res_post.json())
        assert res_post.status_code == 201
        data = res_post.json()
        complaint_id = data["complaint_id"]
        assert complaint_id.startswith("CMP")
        assert data["status"] == "ANALYZING"
        assert data["message"] == "Complaint received successfully"

        print("\n--- Testing GET /api/complaints ---")
        res_list = client.get("/api/complaints")
        print("GET /api/complaints :", res_list.status_code, "Total:", res_list.json()["total"])
        assert res_list.status_code == 200
        assert res_list.json()["total"] >= 1

        print(f"\n--- Testing GET /api/complaints/{complaint_id} ---")
        res_get = client.get(f"/api/complaints/{complaint_id}")
        print(f"GET /api/complaints/{complaint_id} :", res_get.status_code, "Status:", res_get.json()["status"])
        assert res_get.status_code == 200
        assert res_get.json()["complaint_id"] == complaint_id

        print(f"\n--- Testing GET /api/agent/actions/{complaint_id} ---")
        res_actions = client.get(f"/api/agent/actions/{complaint_id}")
        print(f"GET /api/agent/actions/{complaint_id} :", res_actions.status_code, "Actions count:", len(res_actions.json()["actions"]))
        assert res_actions.status_code == 200
        actions = res_actions.json()["actions"]
        assert len(actions) >= 1
        assert actions[0]["action_type"] == "COMPLAINT_RECEIVED"
        print("Initial AgentAction verified:", actions[0]["action_type"], "-", actions[0]["description"])

        print("\n--- Testing GET /api/admin/stats ---")
        res_stats = client.get("/api/admin/stats")
        print("GET /api/admin/stats :", res_stats.status_code, res_stats.json())
        assert res_stats.status_code == 200
        assert res_stats.json()["total_complaints"] >= 1
        assert res_stats.json()["analyzing"] >= 1

        print("\n--- Testing Scaffolds & Adapter ---")
        res_sla = client.post("/api/agent/sla-check")
        print("POST /api/agent/sla-check :", res_sla.status_code, res_sla.json())
        assert res_sla.status_code == 200

        res_resolve = client.post(f"/api/complaints/{complaint_id}/resolve")
        print(f"POST /api/complaints/{complaint_id}/resolve :", res_resolve.status_code, res_resolve.json())
        assert res_resolve.status_code == 200

        res_verify = client.post(f"/api/complaints/{complaint_id}/verify")
        print(f"POST /api/complaints/{complaint_id}/verify :", res_verify.status_code, res_verify.json())
        assert res_verify.status_code == 200

        res_ai = client.post("/api/ai/analyze", json={"complaint_id": complaint_id, "description": payload["description"]})
        print("POST /api/ai/analyze :", res_ai.status_code, "Issue type:", res_ai.json()["issue_type"], "Is stub:", res_ai.json()["is_stub"])
        assert res_ai.status_code == 200

        print("\n========================================")
        print(">>> ALL TESTS PASSED SUCCESSFULLY! <<<")
        print("========================================")

if __name__ == "__main__":
    run_tests()
