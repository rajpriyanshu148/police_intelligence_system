import abc
from typing import Dict, Any
from app.api.v1.schemas.ai_client import (
    ComplaintAnalysisRequest, ComplaintAnalysisResponse,
    EntityExtractionRequest, EntityExtractionResponse,
    FIRDraftRequest, FIRDraftResponse,
    LegalRecommendationRequest, LegalRecommendationResponse
)

class IAIClient(abc.ABC):
    @abc.abstractmethod
    async def analyze_complaint(
        self, payload: ComplaintAnalysisRequest, request_id: str, correlation_id: str
    ) -> ComplaintAnalysisResponse:
        pass

    @abc.abstractmethod
    async def extract_entities(
        self, payload: EntityExtractionRequest, request_id: str, correlation_id: str
    ) -> EntityExtractionResponse:
        pass

    @abc.abstractmethod
    async def assist_fir_draft(
        self, payload: FIRDraftRequest, request_id: str, correlation_id: str
    ) -> FIRDraftResponse:
        pass

    @abc.abstractmethod
    async def recommend_legal_sections(
        self, payload: LegalRecommendationRequest, request_id: str, correlation_id: str
    ) -> LegalRecommendationResponse:
        pass

    @abc.abstractmethod
    async def get_health_status(self) -> Dict[str, Any]:
        pass
