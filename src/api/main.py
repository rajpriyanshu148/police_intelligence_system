import os
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.exceptions import RequestValidationError
from src.database.connection import init_db
from src.vector_store.faiss_store import vector_store
from src.api.auth import router as auth_router
from src.api.cases import router as cases_router
from src.api.complaints import router as complaints_router
from src.api.search import router as search_router
from src.api.agent_api import router as agent_router
from src.api.health import router as health_router
from src.utils.config_loader import config, PROJECT_ROOT
from src.api.middleware import RequestIdMiddleware, TimingMiddleware, LoggingMiddleware, SecurityHeadersMiddleware, RateLimitMiddleware, InMemoryRateLimiter
from src.domain.dto.api_response import ErrorResponse, ErrorDetail, ResponseMeta

app = FastAPI(
    title="Agentic AI Police Intelligence and Assistance System",
    description="Unified police complaint processing and investigation advisory system using LangGraph and FAISS.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure rate limiter (60 requests per minute)
rate_limiter = InMemoryRateLimiter(requests_per_minute=60)

# Register Custom Middlewares in LIFO Order for Request flow
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware, rate_limiter=rate_limiter)
app.add_middleware(TimingMiddleware)
app.add_middleware(RequestIdMiddleware)

# Register routers
app.include_router(auth_router)
app.include_router(cases_router)
app.include_router(complaints_router)
app.include_router(search_router)
app.include_router(agent_router)
app.include_router(health_router)

# Centralized Exception Handlers to return standardized ErrorResponse
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", "N/A")
    correlation_id = getattr(request.state, "correlation_id", "N/A")
    error_meta = ResponseMeta(
        request_id=request_id,
        correlation_id=correlation_id,
        api_version="v1"
    )
    details = exc.errors()
    error_response = ErrorResponse(
        success=False,
        message="Request validation failed.",
        error=ErrorDetail(
            code="VALIDATION_001",
            message="Invalid parameters in request payload.",
            details=details
        ),
        meta=error_meta
    )
    return JSONResponse(
        status_code=422,
        content=error_response.model_dump(),
        headers={
            "X-Request-ID": request_id,
            "X-Correlation-ID": correlation_id
        }
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", "N/A")
    correlation_id = getattr(request.state, "correlation_id", "N/A")
    error_meta = ResponseMeta(
        request_id=request_id,
        correlation_id=correlation_id,
        api_version="v1"
    )
    
    detail_str = exc.detail
    code = f"HTTP_{exc.status_code}"
    message = detail_str
    
    # Try parsing code if formatted as "CODE: message"
    if ":" in detail_str:
        parts = detail_str.split(":", 1)
        potential_code = parts[0].strip()
        if potential_code.isupper() and "_" in potential_code:
            code = potential_code
            message = parts[1].strip()
            
    error_response = ErrorResponse(
        success=False,
        message=message,
        error=ErrorDetail(
            code=code,
            message=message
        ),
        meta=error_meta
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=error_response.model_dump(),
        headers={
            "X-Request-ID": request_id,
            "X-Correlation-ID": correlation_id
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "N/A")
    correlation_id = getattr(request.state, "correlation_id", "N/A")
    error_meta = ResponseMeta(
        request_id=request_id,
        correlation_id=correlation_id,
        api_version="v1"
    )
    error_response = ErrorResponse(
        success=False,
        message="An unexpected system error occurred.",
        error=ErrorDetail(
            code="SYS_001",
            message=str(exc)
        ),
        meta=error_meta
    )
    return JSONResponse(
        status_code=500,
        content=error_response.model_dump(),
        headers={
            "X-Request-ID": request_id,
            "X-Correlation-ID": correlation_id
        }
    )

# Startup routine
@app.on_event("startup")
def startup_event():
    print("[Startup] Initializing Database...")
    init_db()
    
    print("[Startup] Loading Vector Store Index...")
    try:
        vector_store.load_index()
    except Exception as e:
        print(f"[Startup] Error loading vector store: {e}. Attempting to build index...")
        vector_store.build_index()

@app.get("/")
def read_root():
    static_index = PROJECT_ROOT / "src" / "static" / "index.html"
    if static_index.exists():
        return FileResponse(static_index)
    return {
        "status": "online",
        "message": "Police Intelligence REST API is running. Access the API documentation at /docs",
        "documentation_url": "/docs"
    }

# Mount static folder
static_dir = PROJECT_ROOT / "src" / "static"
if not static_dir.exists():
    static_dir.mkdir(parents=True, exist_ok=True)
    with open(static_dir / "index.html", "w") as f:
        f.write("<h1>Police Intelligence System Static Files Directory</h1>")

app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

if __name__ == "__main__":
    uvicorn.run("src.api.main:app", host=config["app"]["host"], port=config["app"]["port"], reload=True)
