import pytest
from app.core.security import get_password_hash
from app.models.officer import Officer
from app.models.complaint import Complaint
from app.models.case import Case

def _officer() -> Officer:
    return Officer(
        username="officer_s4_search", email="off_search@police.gov",
        password_hash=get_password_hash("Admin1234!"),
        badge_number="IND-OFF04", department="CID",
        role="INVESTIGATOR", status="Active",
    )

async def _login(client, username, password="Admin1234!"):
    r = await client.post("/api/v1/auth/login", json={"username": username, "password": password})
    return r.json()["data"]["access_token"]


@pytest.mark.asyncio
async def test_global_search_endpoint(client, db_session):
    off = _officer()
    db_session.add(off)
    await db_session.commit()

    token = await _login(client, "officer_s4_search")

    # Insert searchable complaint and case
    complaint = Complaint(
        citizen_name="Search Citizen", citizen_contact="+911112223333",
        complaint_text="My silver wallet was stolen.", status="Approved", source="WEB"
    )
    db_session.add(complaint)
    await db_session.commit()

    case = Case(
        complaint_id=complaint.id, case_number="CASE/2026/SEARCH",
        title="Silver Wallet Theft", category="Theft", severity="Moderate", priority="P3",
        status="Under Investigation"
    )
    db_session.add(case)
    await db_session.commit()

    # Perform search
    r = await client.post(
        "/api/v1/search",
        json={"query": "Silver", "entity_type": "cases", "page": 1, "page_size": 5},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 200
    results = r.json()["data"]["results"]
    assert "cases" in results
    assert len(results["cases"]) > 0
    assert "Silver" in results["cases"][0]["title"]
