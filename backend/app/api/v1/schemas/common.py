"""Pydantic v2 schemas shared across Sprint 1 routers."""
import datetime
from typing import Any, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.domain.dto.api_response import ResponseMeta, PaginationMeta


class OKResponse(BaseModel):
    success: bool = True
    message: str
    data: Optional[Any] = None
    pagination: Optional[PaginationMeta] = None
    meta: ResponseMeta


def ok(
    data: Any,
    message: str,
    request_id: str,
    correlation_id: str,
    pagination: Optional[PaginationMeta] = None,
) -> dict:
    """Helper to build a standard success envelope dict."""
    meta = ResponseMeta(request_id=request_id, correlation_id=correlation_id)
    return OKResponse(
        success=True,
        message=message,
        data=data,
        pagination=pagination,
        meta=meta,
    ).model_dump()


def make_pagination(total: int, page: int, page_size: int) -> PaginationMeta:
    import math
    total_pages = math.ceil(total / page_size) if page_size else 1
    return PaginationMeta(
        total_items=total,
        page_size=page_size,
        current_page=page,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_previous=page > 1,
    )
