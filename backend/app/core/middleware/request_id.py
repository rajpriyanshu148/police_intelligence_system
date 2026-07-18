import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        corr_id = request.headers.get("X-Correlation-ID") or request.headers.get("X-Request-ID")
        if not corr_id:
            corr_id = str(uuid.uuid4())
            
        req_id = str(uuid.uuid4())
        
        request.state.request_id = req_id
        request.state.correlation_id = corr_id
        
        response = await call_next(request)
        
        response.headers["X-Request-ID"] = req_id
        response.headers["X-Correlation-ID"] = corr_id
        return response
