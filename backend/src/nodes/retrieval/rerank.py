from functools import lru_cache

from sentence_transformers import CrossEncoder

from src.core.config import settings
from src.core.logging import get_logger
from src.interfaces.base_retriever import RetrievedChunk

logger = get_logger(__name__)


@lru_cache
def get_reranker() -> CrossEncoder:
    logger.info(f"Loading reranker model: {settings.RERANK_MODEL}")
    return CrossEncoder(settings.RERANK_MODEL)


def rerank(query: str, chunks: list[RetrievedChunk], top_n: int) -> list[RetrievedChunk]:
    if not chunks:
        return []

    model = get_reranker()
    pairs = [(query, chunk.content) for chunk in chunks] 
    scores = model.predict(pairs)

    reranked = sorted(
        zip(chunks, scores),
        key=lambda pair: pair[1],
        reverse=True
    )[:top_n]

    return [
        RetrievedChunk(
            id=chunk.id,
            content=chunk.content,
            metadata=chunk.metadata,
            score=float(score)
        ) for chunk, score in reranked
    ]   


def rerank_node(state: dict) -> dict:
    if not settings.RERANK_ENABLED:
        top_k = state.get("top_k", settings.RETRIEVAL_TOP_K)
        return {"reranked_results": state.get("fused_results", [])[:top_k]}

    query = state.get("primary_query") or state["query"]
    fused_results = state.get("fused_results", [])
    top_n = state.get("top_k", settings.RERANK_TOP_N)

    logger.info(
        f"[rerank_node] reranking {len(fused_results)} candidates -> top_n={top_n}"
    )

    reranked = rerank(query, fused_results, top_n)

    return {"reranked_results": reranked}