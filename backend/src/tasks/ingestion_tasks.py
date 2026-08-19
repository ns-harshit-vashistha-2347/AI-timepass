from src.graphs.ingestion_graph import ingestion_graph
from src.celery_app import celery_app
from src.models import DocumentStatus, Document  
from src.core.sync_db import get_sync_db
from src.core.logging import get_logger



logger = get_logger(__name__)



def _set_status(document_id: str, status: DocumentStatus, *, error: str | None = None, chunk_count: int | None = None) -> None:
    db = get_sync_db()
    try:
        doc = db.get(Document, document_id)
        if not doc:
            logger.warning(f"Document {document_id} not found while updating status to {status}")
            return
        doc.status = status
        if error is not None:
            doc.error_message = error
        if chunk_count is not None:
            doc.chunk_count = chunk_count
        db.commit()
    finally:
        db.close()


@celery_app.task(
    bind=True,
    name="ingest_document_task",
    max_retries=3,
    default_retry_delay=30,
    acks_late=True,
)
def ingest_document_task(self, document_id: str, file_path: str, source_type: str = "document", user_id: str | None = None):
    logger.info(f"[ingest_document_task] starting document_id={document_id} user_id={user_id} file={file_path}")

    node_to_status = {
        "parse": DocumentStatus.PARSING,
        "chunk": DocumentStatus.CHUNKING,
        "embed": DocumentStatus.EMBEDDING,
        "store": DocumentStatus.STORING
    }

    try:
        _set_status(document_id, DocumentStatus.PARSING)

        final_state:dict = {}

        for step in ingestion_graph.stream(
            {
                "document_id": document_id,
                "file_path": file_path,
                "source_type": source_type,
                "user_id": user_id,
            }
        ):
            for node_name, node_output in step.items():
                final_state.update(node_output)
                next_status = node_to_status.get(node_name)
                if next_status:
                    _set_status(document_id, next_status)

        chunk_count = final_state.get("stored_chunk_count", 0)
        _set_status(document_id, DocumentStatus.COMPLETED, chunk_count=chunk_count)
        logger.info(f"[ingest_document_task] completed document_id={document_id} chunks={chunk_count}")
        return {"document_id": document_id, "status": "completed", "chunk_count": chunk_count}

    except Exception as exc:
        logger.exception(f"[ingest_document_task] failed document_id={document_id}")
        _set_status(document_id, DocumentStatus.FAILED, error=str(exc))

        try:
            raise self.retry(exc=exc)
        except self.MaxRetriesExceededError:
            logger.error(f"[ingest_document_task] max retries exceeded for document_id={document_id}")
            raise

