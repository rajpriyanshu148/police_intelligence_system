import asyncio
import datetime
import random
import time
import httpx
import logging
from typing import Dict, Any, Optional, Callable
from uuid import UUID

from app.domain.interfaces.ai_client import IAIClient
from app.api.v1.schemas.ai_client import (
    ComplaintAnalysisRequest, ComplaintAnalysisResponse,
    EntityExtractionRequest, EntityExtractionResponse,
    FIRDraftRequest, FIRDraftResponse,
    LegalRecommendationRequest, LegalRecommendationResponse,
    ModelMetaVO
)
from app.domain.exceptions.base import DomainException

logger = logging.getLogger("app.infrastructure.ai_client")

# ── AI Client Exception Hierarchy ─────────────────────────────────────────────

class AIClientException(DomainException):
    def __init__(self, message: str, code: str = "AI_500"):
        super().__init__(message, code=code)

class AIConnectionException(AIClientException):
    def __init__(self, message: str):
        super().__init__(message, code="AI_503")

class AIServiceTimeoutException(AIClientException):
    def __init__(self, message: str):
        super().__init__(message, code="AI_504")

class AICircuitBreakerOpenException(AIClientException):
    def __init__(self, message: str):
        super().__init__(message, code="AI_503_CB")

class AIServiceValidationException(AIClientException):
    def __init__(self, message: str):
        super().__init__(message, code="AI_422")

class AIServiceRateLimitedException(AIClientException):
    def __init__(self, message: str):
        super().__init__(message, code="AI_429")

class AIServerErrorException(AIClientException):
    def __init__(self, message: str):
        super().__init__(message, code="AI_500")


# ── Circuit Breaker Implementation ───────────────────────────────────────────

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, cooldown_period: float = 30.0):
        self.failure_threshold = failure_threshold
        self.cooldown_period = cooldown_period
        self.state = "CLOSED"  # CLOSED, OPEN, HALF-OPEN
        self.consecutive_failures = 0
        self.last_state_change = time.time()
        self.success_probes = 0

    def record_success(self):
        if self.state == "HALF-OPEN":
            self.success_probes += 1
            if self.success_probes >= 3:
                self.state = "CLOSED"
                self.consecutive_failures = 0
                self.success_probes = 0
                logger.info("Circuit Breaker transitioned to CLOSED state.")
        elif self.state == "CLOSED":
            self.consecutive_failures = 0

    def record_failure(self):
        self.consecutive_failures += 1
        logger.warning(f"Circuit Breaker failure recorded. Count: {self.consecutive_failures}")
        if self.state == "HALF-OPEN":
            self.state = "OPEN"
            self.last_state_change = time.time()
            self.success_probes = 0
            logger.error("Circuit Breaker transitioned back to OPEN state due to failure in HALF-OPEN.")
        elif self.state == "CLOSED" and self.consecutive_failures >= self.failure_threshold:
            self.state = "OPEN"
            self.last_state_change = time.time()
            logger.error("Circuit Breaker transitioned to OPEN state due to consecutive failures threshold.")

    def check_state(self):
        if self.state == "OPEN":
            elapsed = time.time() - self.last_state_change
            if elapsed >= self.cooldown_period:
                self.state = "HALF-OPEN"
                self.success_probes = 0
                self.last_state_change = time.time()
                logger.info("Circuit Breaker transitioned to HALF-OPEN state (cooldown expired).")
            else:
                raise AICircuitBreakerOpenException(
                    f"Circuit Breaker is OPEN. Cooldown remaining: {int(self.cooldown_period - elapsed)}s"
                )


# ── HTTP AI Client Implementation ─────────────────────────────────────────────

class HTTPTestCaseAIClient(IAIClient):
    # Class-level shared circuit breaker to maintain state across requests
    _breaker = CircuitBreaker()

    def __init__(
        self,
        base_url: str,
        api_key: str,
        api_version: str = "2026-07-17",
        mock_mode: bool = False
    ):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.api_version = api_version
        self.mock_mode = mock_mode

    async def _request_with_retry(
        self,
        method: str,
        endpoint: str,
        payload: Optional[BaseModel] = None,
        timeout: float = 5.0,
        request_id: str = "",
        correlation_id: str = ""
    ) -> Dict[str, Any]:
        """Wrapper executing HTTP requests with Circuit Breaker and Retry logic."""
        if self.mock_mode:
            return await self._get_mock_response(endpoint, payload)

        self._breaker.check_state()

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Request-ID": request_id,
            "X-Correlation-ID": correlation_id,
            "X-AI-API-Version": self.api_version
        }

        url = f"{self.base_url}{endpoint}"
        body = payload.model_dump(mode="json") if payload else None

        # Exponential backoff parameters
        max_retries = 3
        base_delay = 0.1  # 100ms

        async with httpx.AsyncClient() as client:
            for attempt in range(max_retries + 1):
                try:
                    response = await client.request(
                        method=method,
                        url=url,
                        headers=headers,
                        json=body,
                        timeout=timeout
                    )
                    
                    if response.status_code == 200:
                        self._breaker.record_success()
                        return response.json()
                    
                    # Handle specific errors
                    if response.status_code == 422:
                        raise AIServiceValidationException(f"AI Service validation error: {response.text}")
                    if response.status_code == 429:
                        raise AIServiceRateLimitedException("AI Service is rate-limiting requests.")
                    if response.status_code >= 500:
                        raise AIServerErrorException(f"AI Service server error: {response.status_code}")
                    
                    raise AIClientException(f"AI Service unexpected response code {response.status_code}", code="AI_ERR")

                except (httpx.ConnectError, httpx.ConnectTimeout) as e:
                    logger.warning(f"Connection failure on attempt {attempt}: {str(e)}")
                    if attempt == max_retries:
                        self._breaker.record_failure()
                        raise AIConnectionException("Could not connect to the AI Service microservice.")
                
                except httpx.ReadTimeout as e:
                    logger.warning(f"Timeout failure on attempt {attempt}: {str(e)}")
                    if attempt == max_retries:
                        self._breaker.record_failure()
                        raise AIServiceTimeoutException("AI Service timed out processing request.")

                except (AIServerErrorException, AIClientException) as e:
                    logger.warning(f"Error on attempt {attempt}: {str(e)}")
                    if attempt == max_retries:
                        self._breaker.record_failure()
                        raise e

                # Backoff with full jitter
                delay = base_delay * (2 ** attempt)
                jitter = random.uniform(0.0, delay)
                await asyncio.sleep(jitter)

    async def analyze_complaint(
        self, payload: ComplaintAnalysisRequest, request_id: str, correlation_id: str
    ) -> ComplaintAnalysisResponse:
        data = await self._request_with_retry(
            method="POST",
            endpoint="/api/v1/ai/analyze-complaint",
            payload=payload,
            timeout=4.0,  # 4s endpoint timeout
            request_id=request_id,
            correlation_id=correlation_id
        )
        return ComplaintAnalysisResponse.model_validate(data)

    async def extract_entities(
        self, payload: EntityExtractionRequest, request_id: str, correlation_id: str
    ) -> EntityExtractionResponse:
        data = await self._request_with_retry(
            method="POST",
            endpoint="/api/v1/ai/extract-entities",
            payload=payload,
            timeout=3.0,  # 3s endpoint timeout
            request_id=request_id,
            correlation_id=correlation_id
        )
        return EntityExtractionResponse.model_validate(data)

    async def assist_fir_draft(
        self, payload: FIRDraftRequest, request_id: str, correlation_id: str
    ) -> FIRDraftResponse:
        data = await self._request_with_retry(
            method="POST",
            endpoint="/api/v1/ai/assist-fir",
            payload=payload,
            timeout=8.0,  # 8s endpoint timeout
            request_id=request_id,
            correlation_id=correlation_id
        )
        return FIRDraftResponse.model_validate(data)

    async def recommend_legal_sections(
        self, payload: LegalRecommendationRequest, request_id: str, correlation_id: str
    ) -> LegalRecommendationResponse:
        data = await self._request_with_retry(
            method="POST",
            endpoint="/api/v1/ai/recommend-legal",
            payload=payload,
            timeout=5.0,  # 5s endpoint timeout
            request_id=request_id,
            correlation_id=correlation_id
        )
        return LegalRecommendationResponse.model_validate(data)

    async def get_health_status(self) -> Dict[str, Any]:
        if self.mock_mode:
            return {"status": "ready", "components": {"model_loader": "loaded"}}
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/health", timeout=1.5)
                if response.status_code == 200:
                    return response.json()
            except Exception:
                pass
        return {"status": "unhealthy"}

    # ── Mock Responses Fallback ───────────────────────────────────────────────

    async def _get_mock_response(self, endpoint: str, payload: Optional[BaseModel]) -> Dict[str, Any]:
        """Provides high-quality realistic mock responses matching spec requirements."""
        meta = {
            "model_name": "llama-3.1-70b-instruct",
            "provider": "self-hosted",
            "model_version": "v1.1",
            "prompt_template_version": "p-1.02",
            "temperature": 0.2,
            "max_tokens": 1000,
            "processing_time_ms": 280,
            "prompt_hash": "h_9a12b3c4",
            "response_hash": "h_5d6e7f8a"
        }

        if endpoint == "/api/v1/ai/analyze-complaint":
            return {
                "summary": "Theft of a vehicle (Vespa scooter) outside the metro station Sector 4.",
                "category": "Theft",
                "severity": "Major",
                "suggested_priority": "P2",
                "suggested_department": "Traffic & Vehicle Theft Division",
                "missing_information": [
                    {"field": "owner_identity", "description": "Complainant's registration certificate details are missing."}
                ],
                "potential_duplicates": [],
                "model_meta": meta
            }

        if endpoint == "/api/v1/ai/extract-entities":
            return {
                "entities": [
                    {"text": "Rohan Sen", "type": "Person", "confidence": 0.98, "start_offset": 12, "end_offset": 21},
                    {"text": "+919999888877", "type": "Phone", "confidence": 0.99, "start_offset": 31, "end_offset": 44},
                    {"text": "black pistol", "type": "Weapon", "confidence": 0.95, "start_offset": 66, "end_offset": 78},
                    {"text": "Honda Civic (DL-4C-9988)", "type": "Vehicle", "confidence": 0.96, "start_offset": 92, "end_offset": 116},
                    {"text": "CP Central Mall", "type": "Location", "confidence": 0.94, "start_offset": 125, "end_offset": 140}
                ],
                "model_meta": meta
            }

        if endpoint == "/api/v1/ai/assist-fir":
            return {
                "draft_narrative": "FIRST INFORMATION REPORT NARRATIVE:\n\nOn 2026-07-17, the complainant Rohan Sen reported a critical occurrence of vehicle hijacking at CP Central Mall. The suspect carried a weapon described as a black pistol, and stole a Honda Civic registered as DL-4C-9988.",
                "suggested_improvements": ["Verify exact direction of flight with Mall CCTV records."],
                "missing_fields": [
                    {"field": "incident_time", "importance": "High", "explanation": "Incident time is required."}
                ],
                "model_meta": meta
            }

        if endpoint == "/api/v1/ai/recommend-legal":
            return {
                "recommendations": [
                    {
                        "section_code": "BNS Section 309",
                        "legacy_ipc_reference": "IPC Section 392",
                        "title": "Robbery",
                        "confidence": 0.95,
                        "explanation": "Threat at gunpoint coupled with theft meets Robbery criteria.",
                        "procedural_guidance": "Cognizable, Non-bailable."
                    }
                ],
                "model_meta": meta
            }

        raise NotImplementedError(f"Endpoint {endpoint} mock not defined.")
