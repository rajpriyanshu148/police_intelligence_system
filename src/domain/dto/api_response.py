from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional, List, Dict, Any
from datetime import datetime

T = TypeVar('T')

class PaginationMeta(BaseModel):
    total_count: int
    page: int
    page_size: int
    total_pages: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_count": 45,
                "page": 1,
                "page_size": 10,
                "total_pages": 5
            }
        }
    }

class ResponseMeta(BaseModel):
    request_id: str
    correlation_id: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")
    api_version: str = "v1"

    model_config = {
        "json_schema_extra": {
            "example": {
                "request_id": "c6218e8d-1951-419b-a010-090f23023e1f",
                "correlation_id": "a9881ee7-76b6-4554-b4a1-0988be7ac77b",
                "timestamp": "2026-07-17T05:00:00Z",
                "api_version": "v1"
            }
        }
    }

class ResponseEnvelope(BaseModel, Generic[T]):
    success: bool = True
    message: str = ""
    data: Optional[T] = None
    pagination: Optional[PaginationMeta] = None
    meta: ResponseMeta

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": True,
                "message": "Resource retrieved successfully",
                "data": {"status": "active"},
                "meta": {
                    "request_id": "c6218e8d-1951-419b-a010-090f23023e1f",
                    "correlation_id": "a9881ee7-76b6-4554-b4a1-0988be7ac77b",
                    "timestamp": "2026-07-17T05:00:00Z",
                    "api_version": "v1"
                }
            }
        }
    }

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "code": "AUTH_001",
                "message": "Invalid badge credentials or password.",
                "details": None
            }
        }
    }

class ErrorResponse(BaseModel):
    success: bool = False
    message: str = ""
    error: ErrorDetail
    meta: ResponseMeta

    model_config = {
        "json_schema_extra": {
            "example": {
                "success": False,
                "message": "Authentication failed.",
                "error": {
                    "code": "AUTH_001",
                    "message": "Invalid badge credentials or password."
                },
                "meta": {
                    "request_id": "c6218e8d-1951-419b-a010-090f23023e1f",
                    "correlation_id": "a9881ee7-76b6-4554-b4a1-0988be7ac77b",
                    "timestamp": "2026-07-17T05:00:00Z",
                    "api_version": "v1"
                }
            }
        }
    }
