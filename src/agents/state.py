from typing import TypedDict, List, Dict, Any

class AgentState(TypedDict):
    # Input details
    complaint_text: str
    citizen_name: str
    citizen_contact: str

    # Extracted metadata
    category: str
    summary: str
    entities: Dict[str, str]
    severity: str
    priority: str
    
    # RAG matches
    legal_sections: List[Dict[str, Any]]
    sops: List[Dict[str, Any]]
    similar_cases: List[Dict[str, Any]]

    # Generated drafts
    fir_draft: str
    timeline: List[Dict[str, str]]
    status: str

    # Human checkpoint state
    approved: bool
    
    # Outputs/Saved Records
    case_number: str
    fir_number: str
    
    # Handling exceptions
    error: str
