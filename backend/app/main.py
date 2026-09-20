"""
Smart Civic Issue Resolution Agent - Backend Main Entrypoint

Framework: FastAPI
Storage: SQLite via SQLAlchemy
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, HTTPException

from app.config import settings
from app.database import init_db
from app.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Initializes database tables on startup.
    """
    init_db()
    yield


# Initialize database tables on startup
init_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API and Agentic Workflow orchestration for Smart Civic Issue Resolution Agent.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ---------------------------------------------------------------------------
# CORS Configuration
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global Exception Handlers (Clean JSON, no stack traces leaked)
# ---------------------------------------------------------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handles HTTPExceptions cleanly with the standard project error structure.
    """
    if isinstance(exc.detail, dict):
        error_msg = exc.detail.get("error", "An error occurred")
        error_code = exc.detail.get("code", "HTTP_ERROR")
    else:
        error_msg = str(exc.detail)
        error_code = "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": error_msg,
            "code": error_code,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handles request validation errors (422/400) cleanly.
    """
    first_error = exc.errors()[0] if exc.errors() else {}
    field = ".".join(str(loc) for loc in first_error.get("loc", []))
    msg = first_error.get("msg", "Invalid request body")
    detailed_msg = f"{field}: {msg}" if field else msg

    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "success": False,
            "error": f"Validation error: {detailed_msg}",
            "code": "VALIDATION_ERROR",
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Catch-all 500 error handler that conceals internal stack traces.
    """
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error occurred. Please contact support.",
            "code": "INTERNAL_SERVER_ERROR",
        },
    )


# ---------------------------------------------------------------------------
# API Router Registration
# ---------------------------------------------------------------------------
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# ---------------------------------------------------------------------------
# Health & Root Check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "online",
        "docs_url": "/docs",
        "api_prefix": settings.API_V1_PREFIX,
    }
