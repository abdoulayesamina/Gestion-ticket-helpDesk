import logging

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.database import check_database

router = APIRouter(tags=["Supervision"])
logger = logging.getLogger(__name__)


@router.get("/health", summary="Vérifie que l'API répond (liveness)")
def health() -> dict:
    settings = get_settings()
    return {"status": "ok", "service": settings.app_name, "version": settings.app_version}


@router.get(
    "/ready",
    summary="Vérifie que l'API et PostgreSQL sont disponibles (readiness)",
    responses={503: {"description": "Base de données indisponible"}},
)
def ready():
    try:
        check_database()
    except Exception as exc:  # noqa: BLE001
        logger.warning("Readiness check échoué : %s", exc)
        return JSONResponse(
            status_code=503,
            content={"status": "unavailable", "database": "down", "detail": "La base de données est injoignable."},
        )
    return {"status": "ready", "database": "up"}
