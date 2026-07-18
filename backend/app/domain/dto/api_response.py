import datetime
from typing import Any, Optional
from pydantic import BaseModel, Field

class ResponseMeta(BaseModel):
    request_id: str
    correlation_id: str
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z")
    api_version: str = "v1"

class PaginationMeta(BaseModel):
    total_items: int
    page_size: int
    current_page: int
    total_pages: int
    has_next: bool
    has_previous: bool

class ResponseEnvelope(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None
    pagination: Optional[PaginationMeta] = None
    meta: ResponseMeta

class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error: ErrorDetail
    meta: ResponseMeta
