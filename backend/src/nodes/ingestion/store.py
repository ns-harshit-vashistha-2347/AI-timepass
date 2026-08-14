from src.core.cache import bump_bm25_version
from src.core.logging import get_logger
from src.core.vectorstore import get_collections


logger = get_logger(__name__)


def store_node(state: dict) -> dict:
    chunks = state["chunks"]
    embeddings = state["embeddings"]
    source_type = state.get("source_type", "document")

    collection_name = "codebase" if source_type == "codebase" else None
    collection = get_collections(collection_name=collection_name)
    logger.info(f"Storing {len(chunks)} chunks in collection {collection.name}")

    collection.upsert(
        ids=[chunk.id for chunk in chunks],
        embeddings=embeddings,
        documents=[chunk.content for chunk in chunks],
        metadatas=[chunk.metadata for chunk in chunks]
    )

    bump_bm25_version(collection.name)

    return {**state, "stored_chunk_count": len(chunks)}



