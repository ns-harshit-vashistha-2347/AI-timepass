import numpy as np

from src.interfaces.base_retriever import RetrievedChunk
from src.nodes.ingestion.embed import get_embedder
from src.core.config import settings


def mmr_select(query: str, chunks: list[RetrievedChunk], top_k: int, lambda_mult: float = 0.7) -> list[RetrievedChunk]:
    if len(chunks) <= top_k:
        return chunks

    embedder = get_embedder()
    query_emb = np.array(embedder.embed_query(query))
    chunk_embs = np.array(embedder.embed_documents([c.content for c in chunks]))

    def cos_sim(a, b):
        return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8)

    selected, remaining = [], list(range(len(chunks)))
    while remaining and len(selected) < top_k:
        if not selected:
            scores = [cos_sim(query_emb, chunk_embs[i]) for i in remaining]
        else:
            scores = []
            for i in remaining:
                relevance = cos_sim(query_emb, chunk_embs[i])
                diversity = max(cos_sim(chunk_embs[i], chunk_embs[j]) for j in selected)
                scores.append(lambda_mult * relevance - (1 - lambda_mult) * diversity)
        best = remaining[int(np.argmax(scores))]
        selected.append(best)
        remaining.remove(best)

    return [chunks[i] for i in selected]


def mmr_node(state: dict) -> dict:
    if not settings.MMR_ENABLED:
        return {}
    query = state.get("primary_query") or state["query"]
    fused = state.get("fused_results", [])
    top_k = state.get("retrieval_k", state.get("top_k", 5))
    return {"fused_results": mmr_select(query, fused, top_k)}