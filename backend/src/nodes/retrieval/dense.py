from src.core.logging import get_logger
from src.core.vectorstore import get_collections
from src.interfaces.base_retriever import BaseRetriever, RetrievedChunk
from src.nodes.ingestion.embed import get_embedder
from src.nodes.retrieval.fusion import reciprocal_rank_fusion
from src.core.config import settings


logger = get_logger(__name__)



class DenseRetriever(BaseRetriever):
    def __init__(self, collection_name: str):
        self.collection = get_collections(collection_name)
        self.embedder = get_embedder()


    def retrieve(self, query: str, top_k: int) -> list[RetrievedChunk]:
        query_embedding = self.embedder.embed_query(query)
        results = self.collection.query(query_embeddings=[query_embedding], n_results=top_k)

        chunks = []
        ids = results.get("ids", [[]])[0]
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for chunk_id, content, metadata, distance in zip(ids, documents, metadatas, distances):
            score = 1 / (1 + distance)
            chunks.append(RetrievedChunk(id=chunk_id, content=content, metadata=metadata, score=score))

        return chunks


def dense_retrieval_node(state: dict) -> dict:
    queries = state.get("queries") or [state["query"]]
    retrieval_k = state.get("retrieval_k", state.get("top_k", 5))
    logger.info(f"[dense_retrieval_node] searching {len(queries)} query variants, retrieval_k={retrieval_k}")
    
    retriever = DenseRetriever(settings.CHROMA_COLLECTION_DOCUMENTS)

    per_query_results = [retriever.retrieve(q, retrieval_k) for q in queries]

    fused = reciprocal_rank_fusion(per_query_results)[:retrieval_k]
    return {"dense_results": fused}