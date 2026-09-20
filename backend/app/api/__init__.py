"""
API Routes Registration
"""

from fastapi import APIRouter
from app.api.complaints import router as complaints_router
from app.api.agent import router as agent_router

api_router = APIRouter()

# Include sub-routers
api_router.include_router(complaints_router)
api_router.include_router(agent_router)
