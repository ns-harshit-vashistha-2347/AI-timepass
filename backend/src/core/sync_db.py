from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from src.core.config import settings

SYNC_POSTGRES_URL = (
    f"postgresql+psycopg2://{settings.POSTGRES_USER}:{settings.POSTGRES_PASSWORD}"
    f"@{settings.POSTGRES_HOST}:{settings.POSTGRES_PORT}/{settings.POSTGRES_DB}"
)

sync_engine = create_engine(SYNC_POSTGRES_URL, pool_pre_ping=True)

SyncSessionLocal = sessionmaker(bind=sync_engine, class_=Session, expire_on_commit=False)


def get_sync_db() -> Session:
    """Call .close() on the returned session when done (use as a context manager)."""
    return SyncSessionLocal()
