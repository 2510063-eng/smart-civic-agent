"""
Tests for CivicResolve AI Dashboard Assets, Seed Data Schema, and HTTP Server.
"""

import os
import sys
import re
import json
import threading
import time
import urllib.request
import pytest

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

DASHBOARD_DIR = os.path.join(PROJECT_ROOT, "dashboard")


def test_dashboard_files_exist():
    required_files = [
        "index.html",
        "README.md",
        "run_dashboard.py",
        "css/styles.css",
        "js/config.js",
        "js/seedData.js",
        "js/store.js",
        "js/api.js",
        "js/app.js",
    ]
    for rel_path in required_files:
        full_path = os.path.join(DASHBOARD_DIR, rel_path)
        assert os.path.exists(full_path), f"Missing required file: {rel_path}"

def test_html_contains_critical_components():
    html_path = os.path.join(DASHBOARD_DIR, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Core elements required
    assert 'id="gis-map"' in content, "GIS Map container missing"
    assert 'id="kpi-total"' in content, "KPI strip missing"
    assert 'id="verification-cards-container"' in content, "Verification studio missing"
    assert 'id="modal-api-settings"' in content, "API connect further modal missing"
    assert 'id="agent-actions-list"' in content, "Agent actions timeline container missing"
    assert 'id="chart-departments"' in content, "Departments chart canvas missing"
    assert 'id="chart-categories"' in content, "Categories chart canvas missing"

def test_seed_data_schema_compliance():
    seed_path = os.path.join(DASHBOARD_DIR, "js", "seedData.js")
    with open(seed_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Extract complaint IDs
    complaint_ids = re.findall(r'complaint_id:\s*"([^"]+)"', content)
    assert len(complaint_ids) >= 5, f"Expected at least 5 seed complaints, found {len(complaint_ids)}"

    # Check required fields from docs/DATABASE_SCHEMA.md
    required_schema_fields = [
        "complaint_id",
        "citizen_id",
        "description",
        "issue_type",
        "severity",
        "severity_score",
        "department",
        "confidence",
        "reason",
        "status",
        "sla_deadline"
    ]
    for field in required_schema_fields:
        assert f"{field}:" in content, f"Missing database schema field in seed data: {field}"

def test_api_contract_endpoints_defined():
    config_path = os.path.join(DASHBOARD_DIR, "js", "config.js")
    with open(config_path, "r", encoding="utf-8") as f:
        content = f.read()

    assert "/api/complaints" in content
    assert "ENDPOINTS" in content
    assert "ROAD_DEPARTMENT" in content
    assert "SANITATION_DEPARTMENT" in content
    assert "WATER_SUPPLY_SEWERAGE" in content

def test_server_serves_dashboard():
    from dashboard.run_dashboard import Handler
    import socketserver

    test_port = 3899
    httpd = socketserver.TCPServer(("", test_port), Handler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    time.sleep(0.5)
    try:
        url = f"http://127.0.0.1:{test_port}/index.html"
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=3) as response:
            assert response.status == 200
            html = response.read().decode("utf-8")
            assert "CivicResolve AI" in html
            assert "Municipal Admin" in html
    finally:
        httpd.shutdown()
        httpd.server_close()
