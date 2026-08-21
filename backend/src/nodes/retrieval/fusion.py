from src.core.config import settings
from src.core.logging import get_logger
from src.interfaces.base_retriever import RetrievedChunk
import re

logger = get_logger(__name__)

def _bm25_weight_for_query(query: str) -> float:
    """Favor BM25 for queries with quoted phrases, codes, numbers, or acronyms —
    they need exact term matches more than semantic similarity."""
    if re.search(r'"[^"]+"|\b[A-Z]{2,}\b|\b\d+\b', query):
        return 0.65
    return 0.5


def weighted_rrf(dense: list, bm25: list, query: str, k: int | None = None) -> list[RetrievedChunk]:
    rrf_k = k or settings.RRF_K
    bm25_w = _bm25_weight_for_query(query)
    dense_w = 1 - bm25_w

    scores, lookup = {}, {}
    for weight, results in [(dense_w, dense), (bm25_w, bm25)]:
        for rank, chunk in enumerate(results):
            scores[chunk.id] = scores.get(chunk.id, 0.0) + weight / (rrf_k + rank + 1)
            lookup.setdefault(chunk.id, chunk)

    ranked_ids = sorted(scores, key=lambda cid: scores[cid], reverse=True)
    return [RetrievedChunk(id=cid, content=lookup[cid].content, metadata=lookup[cid].metadata, score=scores[cid]) for cid in ranked_ids]

def reciprocal_rank_fusion(
    result_lists: list[list[RetrievedChunk]], k: int | None = None
) -> list[RetrievedChunk]:
    rrf_k = k or settings.RRF_K
    scores: dict[str, float] = {}
    chunk_lookup: dict[str, RetrievedChunk] = {}

    for results in result_lists:
        for rank, chunk in enumerate(results):
            scores[chunk.id] = scores.get(chunk.id, 0.0) + 1.0 / (rrf_k + rank + 1)
            chunk_lookup.setdefault(chunk.id, chunk)

    ranked_ids = sorted(scores.keys(), key=lambda cid: scores[cid], reverse=True)

    fused = []
    for cid in ranked_ids:
        chunk = chunk_lookup[cid]
        fused.append(
            RetrievedChunk(
                id=chunk.id,
                content=chunk.content,
                metadata=chunk.metadata,
                score=scores[cid], 
            )
        )
    return fused


def fusion_node(state: dict) -> dict:
    dense_results = state.get("dense_results", [])
    bm25_results = state.get("bm25_results", [])
    pool_size = state.get("retrieval_k", state.get("top_k", 5))
    query = state.get("primary_query") or state.get("query", "")

    fused = weighted_rrf(dense_results, bm25_results, query)[:pool_size]

    logger.info(
        f"[fusion_node] dense={len(dense_results)} bm25={len(bm25_results)} -> fused={len(fused)}"
    )
    return {"fused_results": fused}
