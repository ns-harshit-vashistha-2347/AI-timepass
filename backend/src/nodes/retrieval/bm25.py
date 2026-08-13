import time
from rank_bm25 import BM25Okapi
from src.core.cache import get_bm25_version
from src.core.logging import get_logger
from src.core.vectorstore import get_collections
from src.nodes.retrieval.fusion import reciprocal_rank_fusion
from src.interfaces.base_retriever import BaseRetriever, RetrievedChunk
from src.core.config import settings

logger = get_logger(__name__)

_BM25_CACHE: dict[str, tuple] = {}

class BM25Retriever(BaseRetriever):
    def __init__(self, collection_name: str):
        self.collection = get_collections(collection_name)

    def _load_corpus(self):
        data = self.collection.get(include=["metadatas", "documents"])
        ids = data.get("ids", [])
        documents = data.get("documents", [])
        metadatas = data.get("metadatas", [])

        return ids, documents, metadatas

    def _get_index(self):
        name = self.collection.name
        current_version = get_bm25_version(name)
        cached = _BM25_CACHE.get(name)

        if cached is not None:
            cached_version, built_at, bm25, ids, documents, metadatas = cached
            is_fresh = (time.time() - built_at) < settings.BM25_CACHE_TTL_SECONDS
            if cached_version == current_version:
                if not is_fresh:
                    _BM25_CACHE[name] = (cached_version, time.time(), bm25, ids, documents, metadatas)
                return bm25, ids, documents, metadatas

        logger.info(f"[BM25Retriever] rebuilding index for '{name}' (version={current_version})")
        ids, documents, metadatas = self._load_corpus()
        bm25 = BM25Okapi([doc.split(" ") for doc in documents]) if documents else None
        _BM25_CACHE[name] = (current_version, time.time(), bm25, ids, documents, metadatas)
        return bm25, ids, documents, metadatas

    def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedChunk]:
        ids, documents, metadatas = self._load_corpus()

        if not documents:
            return []

        tokenized_corpus = [doc.split(" ") for doc in documents]
        bm25 = BM25Okapi(tokenized_corpus)

        tokenized_query = query.split(" ")
        scores = bm25.get_scores(tokenized_query)

        ranked = sorted(
            zip(ids, documents, metadatas, scores),
            key=lambda x: x[3],
            reverse=True
        )[:top_k]

        return [
            RetrievedChunk(
                id=chunk_id,
                content=doc,
                metadata=metadata,
                score=float(score)
            )
            for chunk_id, doc, metadata, score in ranked
        ]


def bm25_retrieval_node(state: dict) -> dict:
    queries = state.get("queries") or [state["query"]]
    retrieval_k = state.get("retrieval_k", state.get("top_k", 5))
    logger.info(f"[bm25_retrieval_node] searching {len(queries)} query variants, retrieval_k={retrieval_k}")

    retriever = BM25Retriever(settings.CHROMA_COLLECTION_DOCUMENTS)

    per_query_results = [retriever.retrieve(q, retrieval_k) for q in queries]
    fused = reciprocal_rank_fusion(per_query_results)[:retrieval_k]

    return {"bm25_results": fused}
    