import pytest
from fastapi.testclient import TestClient
from src.api.main import app
from src.database.connection import init_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    init_db()
    yield

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html") or "status" in response.json()

def test_auth_login():
    response = client.post("/api/v1/auth/login", json={
        "username": "inspector_sharma",
        "password": "password123"
    })
    assert response.status_code == 200
    assert "X-Request-ID" in response.headers
    assert "X-Correlation-ID" in response.headers
    assert "X-Process-Time" in response.headers
    
    body = response.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert body["data"]["badge_number"] == "IND-10827"
    assert body["data"]["role"] == "Investigator"

def test_auth_login_invalid():
    response = client.post("/api/v1/auth/login", json={
        "username": "inspector_sharma",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert body["error"]["code"] == "AUTH_001"

def test_create_and_list_complaints():
    # 1. Create complaint
    response = client.post("/api/v1/complaints", json={
        "citizen_name": "R. K. Gupta",
        "citizen_contact": "+91 9999988888",
        "complaint_text": "Yesterday night someone snatched my gold chain."
    })
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    c_data = body["data"]
    assert c_data["citizen_name"] == "R. K. Gupta"
    assert c_data["status"] == "Pending"

    # 2. List complaints
    list_response = client.get("/api/v1/complaints")
    assert list_response.status_code == 200
    list_body = list_response.json()
    assert list_body["success"] is True
    complaints = list_body["data"]
    assert len(complaints) > 0
    assert complaints[0]["citizen_name"] == "R. K. Gupta"

def test_dashboard_analytics():
    response = client.get("/api/v1/cases/dashboard/analytics")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert "counters" in data
    assert "severity_breakdown" in data
    assert "status_breakdown" in data
    assert "category_breakdown" in data

def test_agent_process_and_approve():
    # 1. Test /api/v1/agent/process
    response = client.post("/api/v1/agent/process", json={
        "complaint_text": "Yesterday a suspect in a red jacket stole my purse in the market.",
        "citizen_name": "Sonia Gupta",
        "citizen_contact": "+91 9898989898"
    })
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    p_data = body["data"]
    assert p_data["status"] == "Under Investigation"
    assert p_data["complaint"]["citizen_name"] == "Sonia Gupta"
    assert p_data["case"]["category"] == "Theft"
    assert len(p_data["entities"]) > 0

    # 2. Test /api/v1/agent/approve
    # Extract details from process output to approve
    approve_payload = {
        "complaint_text": p_data["complaint"]["complaint_text"],
        "citizen_name": p_data["complaint"]["citizen_name"],
        "citizen_contact": p_data["complaint"]["citizen_contact"],
        "category": p_data["case"]["category"],
        "summary": p_data["case"]["title"],
        "severity": p_data["case"]["severity"],
        "priority": p_data["case"]["priority"],
        "entities": {e["entity_type"]: e["entity_value"] for e in p_data["entities"]},
        "legal_sections": [
            {"act": "BNS", "section": "Section 303", "title": "Theft", "description": "Taking property", "punishment": "3 years"}
        ],
        "fir_draft": p_data["fir"]["draft_text"] if p_data["fir"] else "Draft of FIR",
        "timeline": [t for t in p_data["timeline"]],
        "status": p_data["status"]
    }
    
    app_response = client.post("/api/v1/agent/approve", json=approve_payload)
    assert app_response.status_code == 200, app_response.json()
    app_body = app_response.json()
    assert app_body["success"] is True
    app_data = app_body["data"]
    assert app_data["status"] == "Finalized"
    assert "case_number" in app_data
    assert "fir_number" in app_data

def test_list_cases_paginated():
    # List cases
    response = client.get("/api/v1/cases?page=1&page_size=5")
    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "pagination" in body
    assert body["pagination"]["page"] == 1
    assert body["pagination"]["page_size"] == 5
