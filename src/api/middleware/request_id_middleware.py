import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Retrieve Request-ID and Correlation-ID from headers
        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            request_id = str(uuid.uuid4())
            
        correlation_id = request.headers.get("X-Correlation-ID")
        if not correlation_id:
            correlation_id = request_id

        # Attach to request state
        request.state.request_id = request_id
        request.state.correlation_id = correlation_id

        response = await call_next(request)

        # Inject into response headers
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Correlation-ID"] = correlation_id
        return response
