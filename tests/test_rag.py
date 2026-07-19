import pytest
from src.vector_store.faiss_store import vector_store
from src.rag.retriever import rag_retriever

@pytest.fixture(scope="module", autouse=True)
def init_vector_index():
    # Make sure index is loaded/built
    vector_store.load_index()

def test_vector_search():
    # Query for theft
    results = vector_store.search("someone took my wallet yesterday", top_k=2)
    assert len(results) > 0
    # The top matching result should be theft or robbery
    titles = [doc["title"].lower() for doc in results]
    assert any("theft" in t or "robbery" in t for t in titles)

def test_rag_retriever():
    retrieved = rag_retriever.retrieve_context("SBI banking cheat call debit OTP")
    assert "legal_sections" in retrieved
    assert "sops" in retrieved
    
    # Verify we got something related to banking / cyber SOP or cheating BNS
    all_sections = [doc["section"] for doc in retrieved["raw_results"]]
    all_acts = [doc["act"] for doc in retrieved["raw_results"]]
    
    assert any("Section 318" in s or "SOP-01" in s for s in all_sections)

def test_rag_formatting():
    retrieved = {
        "legal_sections": [
            {"act": "BNS", "section": "Section 303", "title": "Theft", "description": "Taking property", "punishment": "3 years"}
        ],
        "sops": [
            {"act": "SOP", "section": "SOP-01", "title": "Cyber Investigation", "description": "Freeze account", "punishment": "Internal"}
        ]
    }
    context = rag_retriever.format_context_for_llm(retrieved)
    assert "Section 303" in context
    assert "Cyber Investigation" in context
