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
        print(">>> 7. AI ADAPTER & STRUCTURED OUTPUT VERIFICATION <<<")
        print("==================================================")

        # 7.1 Test AI Adapter output structure
        ai_payload = {
            "complaint_id": "CMP_AI_TEST_01",
            "description": "Severe sewage pipe overflow flooding road with dirty water",
            "image_url": "uploads/drainage_overflow.jpg",
            "latitude": 16.7052,
            "longitude": 74.2435,
        }
        res_ai = client.post("/api/ai/analyze", json=ai_payload)
        assert res_ai.status_code == 200, f"AI analyze failed: {res_ai.text}"
        ai_res = res_ai.json()
        print(f"POST /api/ai/analyze : 200 OK")
        print(f"  Issue Type: {ai_res['issue_type']} | Severity: {ai_res['severity']} | Dept: {ai_res['department']}")
        print(f"  Confidence: {ai_res['confidence']} | Severity Score: {ai_res['severity_score']} | Is Stub: {ai_res['is_stub']}")
        print(f"  Evidence items: {len(ai_res['evidence'])}")

        assert ai_res["complaint_id"] == "CMP_AI_TEST_01"
        assert ai_res["issue_type"] in ["DRAINAGE", "WATER_LEAKAGE", "OTHER"]
        assert ai_res["severity"] in ["HIGH", "CRITICAL", "MEDIUM", "LOW"]
        assert ai_res["department"] in ["DRAINAGE_DEPARTMENT", "WATER_SUPPLY", "GENERAL"]
        assert 0.0 <= ai_res["severity_score"] <= 1.0
        assert 0.0 <= ai_res["confidence"] <= 1.0
        assert isinstance(ai_res["evidence"], list)
        assert ai_res["is_stub"] is True, "AI adapter stub should be honestly flagged as stub"

        print("\n==================================================")
        print(">>> 8. AUTOMATIC COMPLAINT PROCESSING WORKFLOW <<<")
        print("==================================================")

        # 8.1 Create complaint with auto_process=True
        auto_payload = {
            "description": "Large dangerous pothole on main road causing accidents",
            "image_url": "uploads/pothole_auto.jpg",
            "latitude": 16.7080,
            "longitude": 74.2450,
            "location_text": "Main Road near Central Bank",
            "citizen_id": "CIT005"
        }
        res_auto_create = client.post("/api/complaints?auto_process=true", json=auto_payload)
        assert res_auto_create.status_code == 201
        auto_data = res_auto_create.json()
        auto_cid = auto_data["complaint_id"]
        assert auto_data["complaint"]["status"] == "ASSIGNED"
        assert auto_data["complaint"]["issue_type"] == "POTHOLE"
        assert auto_data["complaint"]["department"] == "ROAD_DEPARTMENT"
        assert auto_data["complaint"]["severity"] == "HIGH"
        assert auto_data["complaint"]["sla_deadline"] is not None
        print(f"POST /api/complaints?auto_process=true : 201 Created & Processed -> {auto_cid}")
        print(f"  Status: {auto_data['complaint']['status']} | Dept: {auto_data['complaint']['department']} | SLA: {auto_data['complaint']['sla_deadline']}")

        # 8.2 Test explicit /process endpoint on an unanalyzed complaint
        manual_payload = {
            "description": "Garbage dump accumulated on street corner smelling terrible",
            "image_url": "uploads/garbage_corner.jpg",
            "location_text": "Street 4 corner",
            "citizen_id": "CIT006"
        }
        res_manual_create = client.post("/api/complaints", json=manual_payload)
        assert res_manual_create.status_code == 201
        manual_cid = res_manual_create.json()["complaint_id"]
        assert res_manual_create.json()["status"] == "ANALYZING"

        res_process = client.post(f"/api/complaints/{manual_cid}/process")
        assert res_process.status_code == 200
        proc_data = res_process.json()
        assert proc_data["status"] == "ASSIGNED"
        assert proc_data["issue_type"] == "GARBAGE"
        assert proc_data["department"] == "SOLID_WASTE_MANAGEMENT"
        assert "CLASSIFY_ISSUE" in proc_data["actions_logged"]
        assert "ASSIGN_DEPARTMENT" in proc_data["actions_logged"]
        print(f"POST /api/complaints/{manual_cid}/process : 200 OK -> ASSIGNED to {proc_data['department']}")

        # 8.3 Verify agent timeline sequence for the processed complaint
        res_auto_timeline = client.get(f"/api/agent/actions/{auto_cid}")
        assert res_auto_timeline.status_code == 200
        auto_actions = [a["action_type"] for a in res_auto_timeline.json()["actions"]]
        print(f"Agent action sequence for {auto_cid}: {auto_actions}")
        assert auto_actions[0] == "COMPLAINT_RECEIVED"
        assert "CLASSIFY_ISSUE" in auto_actions
        assert "ASSIGN_DEPARTMENT" in auto_actions

        print("\n==================================================")
        print(">>> 9. DUPLICATE & RELATED COMPLAINT DETECTION <<<")
        print("==================================================")

        # 9.1 Create two complaints at almost the same coordinates
        c1_payload = {
            "description": "Deep crater pothole near bus stop junction",
            "latitude": 16.7100,
            "longitude": 74.2500,
            "location_text": "Bus Stop Junction",
            "citizen_id": "CIT010"
        }
        res_c1 = client.post("/api/complaints?auto_process=true", json=c1_payload)
        assert res_c1.status_code == 201
        c1_id = res_c1.json()["complaint_id"]

        # Complaint 2: ~45 meters away, same issue type (pothole)
        c2_payload = {
            "description": "Another large pothole on road near bus stop",
            "latitude": 16.7103,
            "longitude": 74.2503,
            "location_text": "Bus Stop Junction",
            "citizen_id": "CIT011"
        }
        res_c2 = client.post("/api/complaints?auto_process=true", json=c2_payload)
        assert res_c2.status_code == 201
        c2_id = res_c2.json()["complaint_id"]

        # Query related complaints for c2
        res_related = client.get(f"/api/complaints/{c2_id}/related")
        assert res_related.status_code == 200
        related_data = res_related.json()
        print(f"GET /api/complaints/{c2_id}/related : 200 OK (Found {related_data['total_related']} related)")
        assert related_data["total_related"] >= 1
        matched_ids = [r["complaint_id"] for r in related_data["related_complaints"]]
        assert c1_id in matched_ids, f"Expected {c1_id} in {matched_ids}"
        c1_match = next(r for r in related_data["related_complaints"] if r["complaint_id"] == c1_id)
        assert c1_match["relationship"] in ["POTENTIAL_DUPLICATE", "RELATED_ISSUE"]
        assert c1_match["distance_meters"] is not None
        assert c1_match["distance_meters"] < 100.0
        assert c1_match["similarity_score"] >= 0.70
        print(f"  Target Match: {c1_match['complaint_id']} | Rel: {c1_match['relationship']} | Score: {c1_match['similarity_score']} | Dist: {c1_match['distance_meters']}m")
        print(f"  Transparent reasons: {c1_match['reasons']}")

        print("\n==================================================")
        print(">>> 10. ENHANCED ADMIN DASHBOARD METRICS <<<")
        print("==================================================")

        res_enhanced_stats = client.get("/api/admin/stats")
        assert res_enhanced_stats.status_code == 200
        e_stats = res_enhanced_stats.json()
        print(f"GET /api/admin/stats : 200 OK")
        print(f"  Total: {e_stats['total_complaints']} | Unresolved: {e_stats['unresolved']} | SLA Breached: {e_stats['sla_breached']}")
        print(f"  By Department: {e_stats['by_department']}")
        print(f"  By Severity: {e_stats['by_severity']}")
        print(f"  Average Resolution Hours: {e_stats['average_resolution_hours']}")

        assert e_stats["total_complaints"] >= 5
        assert e_stats["unresolved"] >= 1
        assert "ROAD_DEPARTMENT" in e_stats["by_department"]
        assert "HIGH" in e_stats["by_severity"]

        print("\n==================================================")
        print(">>> 11. ERROR HANDLING & STATE MACHINE INTEGRITY <<<")
        print("==================================================")

        # 11.1 Non-existent complaint ID returns clean 404
        bad_id = "CMP_NON_EXISTENT_9999"
        res_404_get = client.get(f"/api/complaints/{bad_id}")
        assert res_404_get.status_code == 404
        assert res_404_get.json()["code"] == "COMPLAINT_NOT_FOUND"
        print(f"GET /api/complaints/{bad_id} -> 404 NOT FOUND (Clean error: {res_404_get.json()['code']})")

        res_404_patch = client.patch(f"/api/complaints/{bad_id}/status", json={"status": "ASSIGNED"})
        assert res_404_patch.status_code == 404
        assert res_404_patch.json()["code"] == "COMPLAINT_NOT_FOUND"

        res_404_actions = client.get(f"/api/agent/actions/{bad_id}")
        assert res_404_actions.status_code == 404
        assert res_404_actions.json()["code"] == "COMPLAINT_NOT_FOUND"

        # 11.2 Invalid status enum value returns clean 400
        res_bad_status = client.patch(f"/api/complaints/{cid}/status", json={"status": "TOTALLY_INVALID_STATUS"})
        assert res_bad_status.status_code == 400
        assert res_bad_status.json()["code"] == "INVALID_STATUS"
        print(f"PATCH /api/complaints/{cid}/status (Invalid status) -> 400 BAD REQUEST (Code: {res_bad_status.json()['code']})")

        # 11.3 Illegal operation on already CLOSED complaint
        # (cid is CLOSED from Suite 3)
        res_resolve_closed = client.post(
            f"/api/complaints/{cid}/resolve",
            json={"resolution_description": "Trying to resolve a closed complaint"}
        )
        assert res_resolve_closed.status_code == 400
        assert res_resolve_closed.json()["code"] == "ALREADY_CLOSED"
        print(f"POST /api/complaints/{cid}/resolve (On CLOSED complaint) -> 400 BAD REQUEST (Code: {res_resolve_closed.json()['code']})")

        res_escalate_closed = client.post(f"/api/agent/escalate/{cid}")
        assert res_escalate_closed.status_code == 400
        assert res_escalate_closed.json()["code"] == "ALREADY_CLOSED"
        print(f"POST /api/agent/escalate/{cid} (On CLOSED complaint) -> 400 BAD REQUEST (Code: {res_escalate_closed.json()['code']})")

        # 11.4 Validation error on missing required field
        res_invalid_post = client.post("/api/complaints", json={"description": "a"})  # min_length=3
        assert res_invalid_post.status_code == 400
        assert res_invalid_post.json()["code"] == "VALIDATION_ERROR"
        print(f"POST /api/complaints (Invalid payload) -> 400 BAD REQUEST (Code: {res_invalid_post.json()['code']})")

        print("\n==================================================")
        print(">>> ALL 11 TEST SUITES PASSED SUCCESSFULLY! <<<")
        print("==================================================")


if __name__ == "__main__":
    run_tests()


