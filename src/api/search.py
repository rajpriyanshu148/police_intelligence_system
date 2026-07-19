from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from src.domain.dto.api_response import ResponseEnvelope, ResponseMeta
from src.vector_store.faiss_store import vector_store

router = APIRouter(prefix="/api/v1/search", tags=["search"])

class SearchRequest(BaseModel):
    query: str = Field(description="Natural language query string describing complaint or offense details.")
    top_k: Optional[int] = Field(default=3, description="Maximum number of relevant legal provisions or sections to retrieve.")

    model_config = {
        "json_schema_extra": {
            "example": {
                "query": "theft of vehicle in night",
                "top_k": 3
            }
        }
    }

def make_meta(request: Request) -> ResponseMeta:
    return ResponseMeta(
        request_id=getattr(request.state, "request_id", "N/A"),
        correlation_id=getattr(request.state, "correlation_id", "N/A"),
        api_version="v1"
    )

@router.post("/legal", response_model=ResponseEnvelope, summary="Semantic search of BNS / legal acts", description="Perform vector similarity search on Indian legal codes matching the query context.")
def semantic_legal_search(request: Request, req: SearchRequest):
    try:
        results = vector_store.search(req.query, top_k=req.top_k)
        return ResponseEnvelope(
            success=True,
            message="Semantic legal search completed successfully",
            data={"results": results},
            meta=make_meta(request)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"SYS_001: Legal search failed: {e}"
        )
