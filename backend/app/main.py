import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import DBAPIError, OperationalError

from app.config import get_settings
from app.routers import auth, health, tickets

settings = get_settings()

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("helpdesk")

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="API REST de gestion de tickets de support technique.",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(OperationalError)
@app.exception_handler(DBAPIError)
async def database_unavailable_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Erreur base de données sur %s %s : %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=503,
        content={
            "detail": "La base de données est indisponible. Réessayez dans quelques instants.",
            "code": "DATABASE_UNAVAILABLE",
        },
    )


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(tickets.router)


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"service": settings.app_name, "docs": "/docs", "health": "/health", "ready": "/ready"}
