import time
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from src.domain.interfaces.rate_limiter import IRateLimiter

class InMemoryRateLimiter(IRateLimiter):
    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.ip_records = defaultdict(list)

    def is_allowed(self, client_id: str) -> bool:
        now = time.time()
        timestamps = self.ip_records[client_id]
        # Clean timestamps older than 60 seconds
        timestamps = [t for t in timestamps if now - t < 60]
        self.ip_records[client_id] = timestamps

        if len(timestamps) >= self.requests_per_minute:
            return False
            
        self.ip_records[client_id].append(now)
        return True

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, rate_limiter: IRateLimiter):
        super().__init__(app)
        self.rate_limiter = rate_limiter

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "127.0.0.1"
        if not self.rate_limiter.is_allowed(client_ip):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="RATE_LIMIT_001: Rate limit exceeded. Maximum 60 requests per minute allowed."
            )
        return await call_next(request)
