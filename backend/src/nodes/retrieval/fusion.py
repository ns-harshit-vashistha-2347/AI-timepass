from src.core.config import settings
from src.core.logging import get_logger
from src.interfaces.base_retriever import RetrievedChunk

logger = get_logger(__name__)


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

    fused = reciprocal_rank_fusion([dense_results, bm25_results])[:pool_size]

    logger.info(
        f"[fusion_node] dense={len(dense_results)} bm25={len(bm25_results)} -> fused={len(fused)}"
    )
    return {"fused_results": fused}
