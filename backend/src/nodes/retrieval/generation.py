from langchain_core.messages import HumanMessage, SystemMessage

from src.core.llm import get_llm
from src.core.logging import get_logger

logger = get_logger(__name__)

SYSTEM_PROMPT = """You are a precise assistant answering questions using only the provided context.

Rules:
- Answer using ONLY the information in the context below.
- If the context doesn't contain the answer, say so clearly -- do not guess.
- Cite which source(s) you used when relevant (e.g. "according to page 3").
- Be concise and direct.
"""


def _build_context(chunks) -> str:
    parts = []
    for i, chunk in enumerate(chunks, start=1):
        source = chunk.metadata.get("source", "unknown")
        page = chunk.metadata.get("page_number") or chunk.metadata.get("page")
        label = f"[{i}] {source}" + (f" (page {page})" if page else "")
        parts.append(f"{label}\n{chunk.content}")
    return "\n\n---\n\n".join(parts)


def _pick_chunks(state: dict):
    """Choose the best available chunk source, in order of preference."""
    return (
        state.get("compressed_results")
        or state.get("reranked_results")
        or state.get("fused_results", [])
    )


def generation_node(state: dict) -> dict:
    query = state.get("primary_query") or state["query"]
    chunks = _pick_chunks(state)

    if not chunks:
        logger.warning("[generation_node] no retrieved chunks -- answering without context")
        return {"answer": "I couldn't find any relevant information in the ingested documents to answer this."}

    context = _build_context(chunks)

    complexity = state.get("complexity", "complex")
    task_name = "generate_simple" if complexity == "simple" else "generate_complex"
    llm = get_llm(task=task_name, temperature=0.2)

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n\n{context}\n\nQuestion: {query}"),
    ]

    logger.info(f"[generation_node] generating answer for query='{query[:60]}' with {len(chunks)} chunks")
    response = llm.invoke(messages)

    return {"answer": response.content}
