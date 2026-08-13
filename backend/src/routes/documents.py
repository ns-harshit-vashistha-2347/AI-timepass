import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.db import get_db
from src.core.logging import get_logger
from src.models.document import Document, DocumentStatus
from src.schemas.document import DocumentStatusResponse, DocumentUploadResponse
from src.tasks.ingestion_tasks import ingest_document_task


document_router = APIRouter(prefix='/documents', tags=["Documents"])
logger = get_logger(__name__)



@document_router.post('/upload', response_model=DocumentUploadResponse)
async def upload_document(file: UploadFile, db: AsyncSession = Depends(get_db)):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {sorted(settings.allowed_extensions)}",
        )

    document_id = uuid.uuid4()

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    stored_filename = f"{document_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    contents = await file.read()

    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds max upload size of {settings.MAX_UPLOAD_SIZE_MB}MB",
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    with open(file_path,'wb') as f:
        f.write(contents)

    doc = Document(
        id=document_id,
        filename=file.filename or stored_filename,
        file_path=file_path,
        source_type="document",
        status=DocumentStatus.QUEUED,
    )

    db.add(doc)
    await db.commit()

    task = ingest_document_task.delay(str(document_id), file_path, "document")

    logger.info(f"Queued ingestion for document_id={document_id} task_id={task.id}")

    return DocumentUploadResponse(
        document_id=document_id,
        filename=doc.filename,
        status=doc.status,
        task_id=task.id,
    )



@document_router.get("", response_model=list[DocumentStatusResponse])
async def list_documents(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).order_by(Document.created_at.desc()))
    return result.scalars().all()

