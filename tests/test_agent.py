import pytest
from src.agents.workflow import agent_graph
from src.database.connection import init_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    init_db()

def test_agent_graph_execution():
    complaint_text = "Yesterday around 5 PM, a suspect in a blue shirt stole my bicycle from outside the library."
    initial_state = {
        "complaint_text": complaint_text,
        "citizen_name": "Amit Sen",
        "citizen_contact": "+91-9876543219",
        "category": "",
        "summary": "",
        "entities": {},
        "severity": "",
        "priority": "",
        "legal_sections": [],
        "sops": [],
        "similar_cases": [],
        "fir_draft": "",
        "timeline": [],
        "status": "Pending",
        "approved": False,
        "case_number": "",
        "fir_number": "",
        "error": ""
    }

    # Run the graph
    print("[TestAgent] Invoking agent graph...")
    result = agent_graph.invoke(initial_state)

    # Assert results of LangGraph Nodes
    assert not result.get("error")
    assert result["category"] == "Theft"
    assert "stole my bicycle" in result["summary"].lower()
    assert result["severity"] in ["Low", "Medium"]
    assert result["priority"] in ["P2", "P3"]
    assert len(result["entities"]) > 0
    assert "Victim" in result["entities"]
    assert "Location" in result["entities"]
    assert len(result["timeline"]) > 0
    assert "FIR" in result["fir_draft"]
    assert result["approved"] is False # Halts at review
