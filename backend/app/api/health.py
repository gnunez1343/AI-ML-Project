from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str
    version: str


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint."""
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow().isoformat() + "Z",
        service="dori-api",
        version="0.1.0",
    )
