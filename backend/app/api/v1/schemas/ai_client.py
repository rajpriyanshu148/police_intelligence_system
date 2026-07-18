import datetime
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

# ── Complaint Analysis ────────────────────────────────────────────────────────

class ComplaintAnalysisRequest(BaseModel):
    complaint_id: UUID
    complaint_text: str
    enable_duplicate_check: bool = True
    similarity_threshold: float = 0.82


class PotentialDuplicate(BaseModel):
    case_id: UUID
    case_number: str
    similarity_score: float
    summary: str


class MissingInformationVO(BaseModel):
    field: str
    description: str


class ModelMetaVO(BaseModel):
    model_name: str
    provider: str
    model_version: Optional[str] = None
    prompt_template_version: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    processing_time_ms: Optional[int] = None
    prompt_hash: Optional[str] = None
    response_hash: Optional[str] = None


class ComplaintAnalysisResponse(BaseModel):
    summary: str
    category: str
    severity: str
    suggested_priority: str
    suggested_department: str
    missing_information: List[MissingInformationVO] = Field(default_factory=list)
    potential_duplicates: List[PotentialDuplicate] = Field(default_factory=list)
    model_meta: ModelMetaVO

# ── Entity Extraction ─────────────────────────────────────────────────────────

class EntityExtractionRequest(BaseModel):
    text: str
    entities_to_extract: List[str] = Field(default_factory=lambda: ["Person", "Phone", "Vehicle", "Weapon", "Location"])


class ExtractedEntityVO(BaseModel):
    text: str
    type: str
    confidence: float
    start_offset: Optional[int] = None
    end_offset: Optional[int] = None


class EntityExtractionResponse(BaseModel):
    entities: List[ExtractedEntityVO] = Field(default_factory=list)
    model_meta: ModelMetaVO

# ── FIR Draft Assistance ──────────────────────────────────────────────────────

class FIRDraftRequest(BaseModel):
    complaint_summary: str
    extracted_entities: List[Dict[str, Any]] = Field(default_factory=list)
    officer_notes: Optional[str] = None
    formatting_template: str = "STANDARD"


class FIRDraftResponse(BaseModel):
    draft_narrative: str
    suggested_improvements: List[str] = Field(default_factory=list)
    missing_fields: List[Dict[str, Any]] = Field(default_factory=list)
    model_meta: ModelMetaVO

# ── Legal Recommendation Engine ────────────────────────────────────────────────

class LegalRecommendationRequest(BaseModel):
    crime_description: str


class LegalSectionVO(BaseModel):
    section_code: str
    legacy_ipc_reference: Optional[str] = None
    title: str
    confidence: float
    explanation: str
    procedural_guidance: str


class LegalRecommendationResponse(BaseModel):
    recommendations: List[LegalSectionVO] = Field(default_factory=list)
    model_meta: ModelMetaVO
