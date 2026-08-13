import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_db
from src.models.document import Document
from src.schemas.document import DocumentStatusResponse

status_router = APIRouter(prefix="/documents", tags=["documents"])


@status_router.get("/{document_id}/status", response_model=DocumentStatusResponse)
async def get_document_status(document_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    doc = await db.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc