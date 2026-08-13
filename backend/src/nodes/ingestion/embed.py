from functools import lru_cache

from langchain_community.embeddings import HuggingFaceEmbeddings

from src.core.config import settings
from src.core.logging import get_logger
from src.interfaces.base_embedder import BaseEmbedder



logger = get_logger(__name__)


class HFEmbedder(BaseEmbedder):
    def __init__(self, model_name: str | None = None):
        self.model = HuggingFaceEmbeddings(model_name=model_name or settings.EMBEDDING_MODEL)

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self.model.embed_documents(texts)

    def embed_query(self, text: str) -> list[float]:
        return self.model.embed_query(text)


@lru_cache
def get_embedder() -> BaseEmbedder:
    return HFEmbedder()


def embed_node(state:dict) -> dict:
    chunks = state["chunks"]
    logger.info(f"Embedding {len(chunks)} chunks")

    embedder = get_embedder()
    texts = [chunk.content for chunk in chunks]
    embeddings = embedder.embed_documents(texts)

    return {**state, "embeddings": embeddings}


