from fastapi import APIRouter, Depends

from src.core.deps import get_current_user
from src.core.logging import get_logger
from src.graphs.query_graph import query_graph
from src.models.user import User
from src.schemas.document import QueryRequest, QueryResponse, SourceChunk

query_router = APIRouter(prefix="/query", tags=["query"])
logger = get_logger(__name__)


@query_router.post("", response_model=QueryResponse)
def run_query(payload: QueryRequest, current_user: User = Depends(get_current_user)):
    logger.info(
        f"[/query] user_id={current_user.id} query='{payload.query[:60]}' top_k={payload.top_k}"
    )

    result = query_graph.invoke(
        {
            "query": payload.query,
            "top_k": payload.top_k,
            "user_id": str(current_user.id),
        }
    )

    source_chunks = (
        result.get("compressed_results")
        or result.get("reranked_results")
        or result.get("fused_results", [])
    )
    sources = [
        SourceChunk(
            content=c.metadata.get("original_content") or c.metadata.get("raw_content", c.content),
            metadata=c.metadata,
            score=c.score,
        )
        for c in source_chunks
    ]

    return QueryResponse(answer=result.get("answer", ""), sources=sources)
