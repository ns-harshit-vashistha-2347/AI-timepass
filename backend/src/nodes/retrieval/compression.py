from concurrent.futures import ThreadPoolExecutor

from langchain_core.messages import HumanMessage, SystemMessage

from src.core.config import settings
from src.core.llm import get_llm
from src.core.logging import get_logger
from src.interfaces.base_retriever import RetrievedChunk

logger = get_logger(__name__)


COMPRESSION_SYSTEM_PROMPT = """You extract only the sentences from a passage that are directly relevant to answering a user's question.

Rules:
- Return sentences VERBATIM from the passage. Do not paraphrase, summarize, or add commentary.
- Keep sentences that provide direct answers, supporting facts, or essential context.
- Drop everything unrelated to the question.
- If NO sentence in the passage is relevant, respond with exactly: NONE
- Otherwise, respond with only the relevant sentences, joined by spaces. No preamble, no explanation."""


def _compress_one(query: str, chunk: RetrievedChunk) -> RetrievedChunk:
    llm = get_llm(temperature=0.0)

    try:
        response = llm.invoke([
            SystemMessage(content=COMPRESSION_SYSTEM_PROMPT),
            HumanMessage(content=f"Question: {query}\n\n Passage: \n{chunk.content}")
        ])
        compressed = response.content.strip()

        if not compressed or compressed.upper().startswith("NONE"):
            return None

        return RetrievedChunk(
            id=chunk.id,
            content=compressed,
            metadata={**chunk.metadata, "compressed": True, "original_content": chunk.content},
            score=chunk.score
        )

    except Exception as exc:
        logger.warning(f"[compression] failed for chunk {chunk.id}: {exc}; keeping original")
        return chunk


def compressed_node(state: dict) -> dict:
    if not settings.COMPRESSION_ENABLED:
        return {"compressed_results": state.get("reranked_results", [])} 


    query = state.get("primary_query") or state["query"]
    chunks = state.get("reranked_results", [])

    if not chunks:
        return {"compressed_results": []}

    with ThreadPoolExecutor(max_workers=min(len(chunks), 5)) as executor:
        results = list(executor.map(lambda x: _compress_one(query, x), chunks))

    compressed = [r for r in results if r is not None]
    logger.info(f"[compression_node] {len(chunks)} chunks -> {len(compressed)} after compression")

    if not compressed:
        logger.warning("[compression_node] compression dropped all chunks; falling back to reranked")
        return {"compressed_results": chunks}

    return {"compressed_results": compressed}