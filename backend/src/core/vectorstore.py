from functools import lru_cache

import chromadb

from src.core.config import settings

@lru_cache()
def get_chroma_client() -> chromadb.Client:
    return chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)

def get_collections(name: str | None = None):
    client = get_chroma_client()
    return client.get_or_create_collection(name or settings.CHROMA_COLLECTION_DOCUMENTS)