import sys
import datetime
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from loguru import logger

logger.remove()
logger.add(
    sys.stderr,
    format="{message}",
    serialize=True,
    level="INFO"
)

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        req_id = getattr(request.state, "request_id", "unknown")
        corr_id = getattr(request.state, "correlation_id", "unknown")
        latency = getattr(request.state, "latency", 0.0)
        user_id = getattr(request.state, "user_id", "anonymous")
        
        log_payload = {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat() + "Z",
            "request_id": req_id,
            "correlation_id": corr_id,
            "method": request.method,
            "endpoint": request.url.path,
            "status_code": response.status_code,
            "latency": f"{latency:.4f}s",
            "user_id": user_id
        }
        
        logger.info(log_payload)
        
        # Persist telemetry metric asynchronously
        from app.database.session import AsyncSessionLocal
        from app.models.administration import TelemetryMetric
        from uuid import uuid4, UUID
        
        async def save_telemetry():
            try:
                async with AsyncSessionLocal() as db_session:
                    metric = TelemetryMetric(
                        id=uuid4(),
                        timestamp=datetime.datetime.now(datetime.timezone.utc),
                        endpoint=request.url.path,
                        method=request.method,
                        status_code=response.status_code,
                        latency_ms=int(latency * 1000),
                        officer_id=None
                    )
                    if user_id and user_id != "anonymous":
                        try:
                            metric.officer_id = UUID(str(user_id))
                        except ValueError:
                            pass
                    db_session.add(metric)
                    await db_session.commit()
            except Exception:
                # Silently catch telemetry write errors to prevent request blockages
                pass

        import asyncio
        asyncio.create_task(save_telemetry())

        return response

