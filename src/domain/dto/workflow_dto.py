from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ComplaintResult(BaseModel):
    citizen_name: str
    citizen_contact: str
    complaint_text: str

class CaseResult(BaseModel):
    case_number: Optional[str] = None
    title: str
    category: str
    severity: str
    priority: str
    status: str

class FIRResult(BaseModel):
    fir_number: Optional[str] = None
    draft_text: str
    legal_sections: str

class EntityResult(BaseModel):
    entity_type: str
    entity_value: str
    confidence: float

class TimelineEventResult(BaseModel):
    timestamp: str
    description: str

class WorkflowResult(BaseModel):
    status: str
    complaint: ComplaintResult
    case: CaseResult
    fir: Optional[FIRResult] = None
    entities: List[EntityResult] = Field(default_factory=list)
    timeline: List[TimelineEventResult] = Field(default_factory=list)
    confidence: float = 1.0
    recommendations: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

def map_state_to_workflow_result(state: dict) -> WorkflowResult:
    # Extract similar case titles as recommendations
    recs = [c.get("title", "") for c in state.get("similar_cases", []) if c.get("title")]
    
    # Format legal sections as comma separated string
    legal_sects = ", ".join([doc.get("section", "") for doc in state.get("legal_sections", [])])

    # Convert entities dict to list of EntityResult
    entity_list = []
    for k, v in state.get("entities", {}).items():
        entity_list.append(EntityResult(
            entity_type=k,
            entity_value=v,
            confidence=0.92  # Default simulation confidence
        ))

    # Convert timeline
    timeline_list = []
    for ev in state.get("timeline", []):
        timeline_list.append(TimelineEventResult(
            timestamp=ev.get("timestamp", "Unknown Time"),
            description=ev.get("description", "")
        ))

    return WorkflowResult(
        status=state.get("status", "Pending"),
        complaint=ComplaintResult(
            citizen_name=state.get("citizen_name", "Anonymous"),
            citizen_contact=state.get("citizen_contact", "N/A"),
            complaint_text=state.get("complaint_text", "")
        ),
        case=CaseResult(
            case_number=state.get("case_number") or None,
            title=f"Investigation into {state.get('category', 'Reported Incident')}",
            category=state.get("category", "Unclassified"),
            severity=state.get("severity", "Medium"),
            priority=state.get("priority", "P3"),
            status=state.get("status", "Pending")
        ),
        fir=FIRResult(
            fir_number=state.get("fir_number") or None,
            draft_text=state.get("fir_draft", "No FIR Draft Generated"),
            legal_sections=legal_sects
        ) if state.get("fir_draft") or state.get("fir_number") else None,
        entities=entity_list,
        timeline=timeline_list,
        confidence=0.95,
        recommendations=recs,
        metadata={
            "sops": state.get("sops", []),
            "similar_cases": state.get("similar_cases", [])
        }
    )
