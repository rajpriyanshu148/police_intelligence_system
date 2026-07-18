import datetime
from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from app.domain.dto.api_response import ErrorResponse, ErrorDetail, ResponseMeta
from app.domain.exceptions.base import DomainException

# Prefixes of exception codes that represent "not found" (404)
_NOT_FOUND_CODES = {"CASE_001", "COMPLAINT_001", "OFFICER_001", "CITIZEN_001"}


def _status_for_domain_exc(exc: DomainException) -> int:
    if exc.code == "AUTH_003":
        return status.HTTP_403_FORBIDDEN
    if exc.code.startswith("AUTH_"):
        return status.HTTP_401_UNAUTHORIZED
    if exc.code in _NOT_FOUND_CODES:
        return status.HTTP_404_NOT_FOUND
    return status.HTTP_400_BAD_REQUEST


class ExceptionHandlerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as exc:
            return self.handle_exception(request, exc)

    def handle_exception(self, request: Request, exc: Exception) -> JSONResponse:
        req_id = getattr(request.state, "request_id", "unknown")
        corr_id = getattr(request.state, "correlation_id", "unknown")

        meta = ResponseMeta(
            request_id=req_id,
            correlation_id=corr_id,
            timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z",
            api_version="v1"
        )

        if isinstance(exc, DomainException):
            payload = ErrorResponse(
                success=False,
                message=exc.message,
                error=ErrorDetail(code=exc.code, message=exc.message),
                meta=meta
            )
            return JSONResponse(
                status_code=_status_for_domain_exc(exc),
                content=payload.model_dump()
            )

        elif isinstance(exc, HTTPException):
            payload = ErrorResponse(
                success=False,
                message=str(exc.detail),
                error=ErrorDetail(code="HTTP_ERROR", message=str(exc.detail)),
                meta=meta
            )
            return JSONResponse(status_code=exc.status_code, content=payload.model_dump())

        elif isinstance(exc, RequestValidationError):
            payload = ErrorResponse(
                success=False,
                message="Request validation failed.",
                error=ErrorDetail(code="VALIDATION_001", message=str(exc.errors())),
                meta=meta
            )
            return JSONResponse(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                content=payload.model_dump()
            )

        else:
            payload = ErrorResponse(
                success=False,
                message="An unexpected system error occurred.",
                error=ErrorDetail(code="SYS_001", message=str(exc)),
                meta=meta
            )
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=payload.model_dump()
            )
