"""
Backend API & Agentic Workflow Test Suite (Milestone 1 + Milestone 2)
"""

from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal
from app.models import Complaint, ComplaintStatus, SeverityLevel


def run_tests():
    with TestClient(app) as client:
        print("==================================================")
        print(">>> 1. CORE API & FOUNDATION TESTS <<<")
        print("==================================================")

        # 1.1 Documentation endpoints
        res_root = client.get("/")
        assert res_root.status_code == 200, f"Root failed: {res_root.text}"
        print("GET / : 200 OK")

        res_docs = client.get("/docs")
        assert res_docs.status_code == 200, f"Docs failed: {res_docs.text}"
        print("GET /docs : 200 OK")

        res_openapi = client.get("/openapi.json")
        assert res_openapi.status_code == 200, f"OpenAPI failed: {res_openapi.text}"
        print("GET /openapi.json : 200 OK")

        # 1.2 Complaint Creation (Intake)
        payload = {
            "description": "Large dangerous pothole causing heavy traffic slowdown on highway",
            "image_url": "uploads/pothole_initial.jpg",
            "latitude": 16.7050,
            "longitude": 74.2433,
            "location_text": "Highway junction near main market",
            "citizen_id": "CIT001"
        }
        res_post = client.post("/api/complaints", json=payload)
        assert res_post.status_code == 201, f"Create failed: {res_post.text}"
        data = res_post.json()
        cid = data["complaint_id"]
        assert cid.startswith("CMP")
        assert data["status"] == "ANALYZING"
        print(f"POST /api/complaints : 201 Created -> {cid} (status: {data['status']})")

        # 1.3 Complaint Retrieval & Listing
        res_get = client.get(f"/api/complaints/{cid}")
        assert res_get.status_code == 200
        assert res_get.json()["complaint_id"] == cid
        print(f"GET /api/complaints/{cid} : 200 OK")

        res_list = client.get("/api/complaints")
        assert res_list.status_code == 200
        assert res_list.json()["total"] >= 1
        print(f"GET /api/complaints : 200 OK (total: {res_list.json()['total']})")

        print("\n==================================================")
        print(">>> 2. COMPLAINT LIFECYCLE & STATE TRANSITIONS <<<")
        print("==================================================")

        # 2.1 Transition to ASSIGNED
        res_assign = client.patch(
            f"/api/complaints/{cid}/status",
            json={"status": "ASSIGNED", "reason": "Assigned to Road Department by dispatcher"}
        )
        assert res_assign.status_code == 200
        assert res_assign.json()["status"] == "ASSIGNED"
        print(f"PATCH /api/complaints/{cid}/status -> ASSIGNED : 200 OK")

        # 2.2 Transition to IN_PROGRESS
        res_progress = client.patch(
            f"/api/complaints/{cid}/status",
            json={"status": "IN_PROGRESS", "reason": "Work crew dispatched on site"}
        )
        assert res_progress.status_code == 200
        assert res_progress.json()["status"] == "IN_PROGRESS"
        print(f"PATCH /api/complaints/{cid}/status -> IN_PROGRESS : 200 OK")

        # 2.3 Follow-up trigger
        res_follow_up = client.post(
            f"/api/agent/follow-up/{cid}",
            json={"reason": "Routine progress check after 12 hours"}
        )
        assert res_follow_up.status_code == 200
        assert res_follow_up.json()["action"] == "FOLLOW_UP"
        assert res_follow_up.json()["status"] == "FOLLOW_UP"
        print(f"POST /api/agent/follow-up/{cid} -> FOLLOW_UP : 200 OK")

        # 2.4 Escalation trigger
        res_escalate = client.post(
            f"/api/agent/escalate/{cid}",
            json={"reason": "Delay reported; escalating to Executive Engineer"}
        )
        assert res_escalate.status_code == 200
        assert res_escalate.json()["action"] == "ESCALATE"
        assert res_escalate.json()["status"] == "ESCALATED"
        print(f"POST /api/agent/escalate/{cid} -> ESCALATED : 200 OK")

        print("\n==================================================")
        print(">>> 3. WORKER RESOLUTION & AI VERIFICATION <<<")
        print("==================================================")

        # 3.1 Worker submits resolution
        res_resolve = client.post(
            f"/api/complaints/{cid}/resolve",
            json={
                "resolution_description": "Pothole filled with cold mix asphalt and compacted",
                "after_image_url": "uploads/pothole_fail_attempt1.jpg"
            }
        )
        assert res_resolve.status_code == 200
        assert res_resolve.json()["status"] == "VERIFICATION"
        print(f"POST /api/complaints/{cid}/resolve -> VERIFICATION : 200 OK")

        # 3.2 AI Verification: Failure case simulation
        res_verify_fail = client.post(
            f"/api/complaints/{cid}/verify",
            json={"after_image_url": "uploads/fail_pothole_incomplete.jpg"}
        )
        assert res_verify_fail.status_code == 200
        assert res_verify_fail.json()["verification"] == "FAILED"
        assert res_verify_fail.json()["next_status"] == "REOPENED"
        print(f"POST /api/complaints/{cid}/verify (Simulated Failure) -> REOPENED : 200 OK")

        # Confirm complaint status is now REOPENED
        res_check_reopened = client.get(f"/api/complaints/{cid}")
        assert res_check_reopened.json()["status"] == "REOPENED"
        print(f"Verified complaint status is REOPENED: 200 OK")

        # 3.3 Worker re-submits resolution
        res_re_resolve = client.post(
            f"/api/complaints/{cid}/resolve",
            json={
                "resolution_description": "Complete asphalt resurfacing and steam roller compaction done",
                "after_image_url": "uploads/pothole_fixed_final.jpg"
            }
        )
        assert res_re_resolve.status_code == 200
        assert res_re_resolve.json()["status"] == "VERIFICATION"
        print(f"POST /api/complaints/{cid}/resolve (Re-submission) -> VERIFICATION : 200 OK")

        # 3.4 AI Verification: Success case simulation
        res_verify_pass = client.post(
            f"/api/complaints/{cid}/verify",
            json={"after_image_url": "uploads/fixed_pothole_final.jpg"}
        )
        assert res_verify_pass.status_code == 200
        assert res_verify_pass.json()["verification"] == "PASSED"
        assert res_verify_pass.json()["next_status"] == "CLOSED"
        print(f"POST /api/complaints/{cid}/verify (Successful Fix) -> CLOSED : 200 OK")

        # Confirm complaint status is now CLOSED and closed_at is populated
        res_check_closed = client.get(f"/api/complaints/{cid}")
        assert res_check_closed.json()["status"] == "CLOSED"
        assert res_check_closed.json()["closed_at"] is not None
        print(f"Verified complaint status is CLOSED with closed_at timestamp: 200 OK")

        print("\n==================================================")
        print(">>> 4. SLA MONITORING & AUTONOMOUS BREACH ENGINE <<<")
        print("==================================================")

        # Set up controlled test complaints with expired SLA deadlines
        db = SessionLocal()
        past_time = datetime.utcnow() - timedelta(hours=3)

        # Complaint A: Normal severity with expired SLA
        comp_a = Complaint(
            complaint_id="CMP_SLA_TEST_01",
            citizen_id="CIT002",
            description="Overdue garbage pile at market",
            status=ComplaintStatus.IN_PROGRESS.value,
            severity=SeverityLevel.MEDIUM.value,
            sla_deadline=past_time,
            created_at=past_time - timedelta(days=1),
            updated_at=past_time,
        )

        # Complaint B: CRITICAL severity with expired SLA -> should immediately ESCALATE
        comp_b = Complaint(
            complaint_id="CMP_SLA_TEST_02",
            citizen_id="CIT003",
            description="Live wire hanging dangerously over school gate",
            status=ComplaintStatus.IN_PROGRESS.value,
            severity=SeverityLevel.CRITICAL.value,
            sla_deadline=past_time,
            created_at=past_time - timedelta(days=1),
            updated_at=past_time,
        )

        # Delete existing test rows if any and insert
        db.query(Complaint).filter(Complaint.complaint_id.in_(["CMP_SLA_TEST_01", "CMP_SLA_TEST_02"])).delete(synchronize_session=False)
        db.add(comp_a)
        db.add(comp_b)
        db.commit()
        db.close()

        # Run SLA check
        res_sla = client.post("/api/agent/sla-check")
        assert res_sla.status_code == 200
        sla_data = res_sla.json()
        print(f"POST /api/agent/sla-check : 200 OK -> Checked: {sla_data['checked']}, Breached: {sla_data['breached']}")
        assert sla_data["breached"] >= 2

        # Verify automated decisions
        actions_map = {item["complaint_id"]: item["action"] for item in sla_data["actions_taken"]}
        assert actions_map.get("CMP_SLA_TEST_01") == "FOLLOW_UP", "Expected FOLLOW_UP for normal breach"
        assert actions_map.get("CMP_SLA_TEST_02") == "ESCALATE", "Expected ESCALATE for critical breach"
        print(f"Verified autonomous decisions: CMP_SLA_TEST_01 -> FOLLOW_UP | CMP_SLA_TEST_02 -> ESCALATE")

        print("\n==================================================")
        print(">>> 5. AUDIT LOGGING & AGENT ACTION TIMELINE <<<")
        print("==================================================")

        res_timeline = client.get(f"/api/agent/actions/{cid}")
        assert res_timeline.status_code == 200
        actions = res_timeline.json()["actions"]
        print(f"GET /api/agent/actions/{cid} : 200 OK (Total actions: {len(actions)})")

        action_types = [a["action_type"] for a in actions]
        print("Action timeline sequence:")
        for idx, a in enumerate(actions, 1):
            print(f"  {idx}. [{a['action_type']}] {a['description']} (Result: {a['result']})")

        # Verify key milestones in timeline
        assert "COMPLAINT_RECEIVED" in action_types
        assert "STATUS_CHANGE_ASSIGNED" in action_types
        assert "STATUS_CHANGE_IN_PROGRESS" in action_types
        assert "FOLLOW_UP" in action_types
        assert "ESCALATE" in action_types
        assert "RESOLVE_SUBMITTED" in action_types
        assert "VERIFY_RESOLUTION" in action_types

        print("\n==================================================")
        print(">>> 6. ADMIN DASHBOARD METRICS <<<")
        print("==================================================")

        res_stats = client.get("/api/admin/stats")
        assert res_stats.status_code == 200
        stats = res_stats.json()
        print(f"GET /api/admin/stats : 200 OK")
        print(f"  Total: {stats['total_complaints']} | Closed: {stats['closed']} | Escalated: {stats['escalated']} | Reopened: {stats['reopened']}")

        print("\n==================================================")
        print(">>> ALL TESTS PASSED SUCCESSFULLY! <<<")
        print("==================================================")


if __name__ == "__main__":
    run_tests()
