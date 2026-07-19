import json
from datetime import datetime
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        request_id = getattr(request.state, "request_id", "N/A")
        correlation_id = getattr(request.state, "correlation_id", "N/A")
        latency = getattr(request.state, "latency", 0.0)
        
        log_payload = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_id": request_id,
            "correlation_id": correlation_id,
            "method": request.method,
            "endpoint": request.url.path,
            "status_code": response.status_code,
            "latency": f"{latency:.4f}s"
        }
        
        logger.info(json.dumps(log_payload))
        return response
