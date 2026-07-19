import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from src.utils.telemetry import telemetry

class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        request.state.latency = process_time
        telemetry.record_request(process_time, response.status_code)
        return response
