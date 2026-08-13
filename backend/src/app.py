from contextlib import asynccontextmanager

from fastapi import FastAPI

from src.core.config import settings
from src.core.logging import get_logger, setup_logging
from src.routes.documents import document_router
from src.routes.query import query_router
from src.routes.status import status_router

setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting {settings.APP_NAME} [{settings.ENV}]")
    yield
    logger.info("Shutting down")


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.include_router(document_router)
app.include_router(status_router)
app.include_router(query_router)


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.ENV}
