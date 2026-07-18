import pytest
import time
import asyncio
import httpx
from unittest.mock import AsyncMock, patch
from app.infrastructure.ai_client.http_client import (
    HTTPTestCaseAIClient, CircuitBreaker,
    AIServiceTimeoutException, AICircuitBreakerOpenException,
    AIConnectionException, AIServerErrorException
)
from app.api.v1.schemas.ai_client import (
    ComplaintAnalysisRequest, EntityExtractionRequest,
    FIRDraftRequest, LegalRecommendationRequest
)
from uuid import uuid4

@pytest.fixture
def mock_client():
    return HTTPTestCaseAIClient(
        base_url="http://mock-ai-service",
        api_key="mock_key",
        mock_mode=False
    )


@pytest.mark.asyncio
async def test_ai_client_success(mock_client):
    payload = ComplaintAnalysisRequest(
        complaint_id=uuid4(),
        complaint_text="My Vespa scooter was stolen."
    )
    
    mock_response = {
        "summary": "Stolen Vespa scooter.",
        "category": "Theft",
        "severity": "Major",
        "suggested_priority": "P2",
        "suggested_department": "Traffic Division",
        "missing_information": [],
        "potential_duplicates": [],
        "model_meta": {
            "model_name": "llama-3.1-70b-instruct",
            "provider": "self-hosted",
            "model_version": "v1.1"
        }
    }
    
    # Mock httpx.AsyncClient.request
    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
        mock_req.return_value = httpx.Response(200, json=mock_response)
        
        result = await mock_client.analyze_complaint(payload, "req_1", "corr_1")
        assert result.category == "Theft"
        assert result.severity == "Major"
        assert result.summary == "Stolen Vespa scooter."
        mock_req.assert_called_once()


@pytest.mark.asyncio
async def test_ai_client_retries_on_timeout(mock_client):
    payload = EntityExtractionRequest(text="Officer Rohan Sen arrived.")
    
    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
        # Simulate 3 timeouts, then a success
        mock_req.side_effect = [
            httpx.ReadTimeout("Timeout occurred"),
            httpx.ReadTimeout("Timeout occurred"),
            httpx.Response(200, json={
                "entities": [{"text": "Rohan Sen", "type": "Person", "confidence": 0.99}],
                "model_meta": {"model_name": "ner-bert", "provider": "self-hosted"}
            })
        ]
        
        # Override sleep to run tests fast
        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            result = await mock_client.extract_entities(payload, "req_2", "corr_2")
            assert len(result.entities) == 1
            assert result.entities[0].text == "Rohan Sen"
            assert mock_req.call_count == 3
            assert mock_sleep.call_count == 2


@pytest.mark.asyncio
async def test_ai_client_raises_timeout_after_max_retries(mock_client):
    payload = FIRDraftRequest(complaint_summary="Robbery")
    
    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
        mock_req.side_effect = httpx.ReadTimeout("Timeout occurred")
        
        with patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(AIServiceTimeoutException):
                await mock_client.assist_fir_draft(payload, "req_3", "corr_3")
            assert mock_req.call_count == 4  # Initial try + 3 retries


@pytest.mark.asyncio
async def test_circuit_breaker_transitions(mock_client):
    payload = LegalRecommendationRequest(crime_description="Trespass")
    
    # Reset circuit breaker state before testing
    mock_client._breaker.state = "CLOSED"
    mock_client._breaker.consecutive_failures = 0
    mock_client._breaker.cooldown_period = 0.2  # Very short cooldown for test
    
    with patch("httpx.AsyncClient.request", new_callable=AsyncMock) as mock_req:
        mock_req.side_effect = httpx.ConnectError("Connection refused")
        
        # Trip the breaker (5 failures)
        with patch("asyncio.sleep", new_callable=AsyncMock):
            for _ in range(5):
                try:
                    await mock_client.recommend_legal_sections(payload, "req_4", "corr_4")
                except AIConnectionException:
                    pass
                    
        assert mock_client._breaker.state == "OPEN"
        
        # Subseqent calls must trip immediately with CircuitBreakerOpenException without hitting network
        mock_req.reset_mock()
        with pytest.raises(AICircuitBreakerOpenException):
            await mock_client.recommend_legal_sections(payload, "req_4", "corr_4")
        mock_req.assert_not_called()
        
        # Wait for cooldown to expire using real sleep (outside the mock patch)
        await asyncio.sleep(0.3)
        
        # Now breaker must transition to HALF-OPEN on next request and call network
        mock_req.side_effect = None
        mock_req.return_value = httpx.Response(200, json={
            "recommendations": [],
            "model_meta": {
                "model_name": "llama",
                "provider": "self",
                "model_version": "v1.1",
                "prompt_template_version": "1.0",
                "temperature": 0.5,
                "max_tokens": 100,
                "processing_time_ms": 10,
                "prompt_hash": "a",
                "response_hash": "b"
            }
        })
        
        result = await mock_client.recommend_legal_sections(payload, "req_5", "corr_5")
        assert mock_client._breaker.state == "HALF-OPEN"
        assert result.recommendations == []
        
        # 2 more successes must close it
        await mock_client.recommend_legal_sections(payload, "req_5", "corr_5")
        await mock_client.recommend_legal_sections(payload, "req_5", "corr_5")
        assert mock_client._breaker.state == "CLOSED"
