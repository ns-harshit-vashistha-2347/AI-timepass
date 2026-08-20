import json

from langchain_core.messages import HumanMessage, SystemMessage

from src.core.config import settings
from src.core.llm import get_llm
from src.core.logging import get_logger

logger = get_logger(__name__)

VERIFY_SYSTEM_PROMPT = """You verify whether an answer is fully supported by the given source passages.

Given a question, an answer, and the source passages the answer was based on, judge:
- "grounded": every factual claim in the answer is directly supported by at least one source passage.
- "partial": some claims are supported but others are not, or the answer stretches beyond what sources say.
- "ungrounded": the answer is largely unsupported, contradicts sources, or is fabricated.

Respond as JSON with exactly this shape, and nothing else:
{"verdict": "grounded" | "partial" | "ungrounded", "reason": "one short sentence"}"""


def _pick_chunks(state: dict):
    return (
        state.get("compressed_results")
        or state.get("reranked_results")
        or state.get("fused_results", [])
    )


def _format_sources(chunks) -> str:
    return "\n\n---\n\n".join(f"[{i}] {c.content}" for i, c in enumerate(chunks, start=1))


def verify_node(state: dict) -> dict:
    if not settings.SELF_CORRECTION_ENABLED:
        return {"verdict": "grounded", "correction_attempts": state.get("correction_attempts", 0)}

    answer = state.get("answer", "")
    chunks = _pick_chunks(state)

    if not answer or not chunks:
        return {"verdict": "grounded", "correction_attempts": state.get("correction_attempts", 0)}

    if "couldn't find" in answer.lower() or "don't know" in answer.lower():
        return {"verdict": "grounded", "correction_attempts": state.get("correction_attempts", 0)}

    query = state.get("primary_query") or state["query"]
    llm = get_llm(task="verify", temperature=0.0)

    try:
        response = llm.invoke([
            SystemMessage(content=VERIFY_SYSTEM_PROMPT),
            HumanMessage(content=(
                f"Question: {query}\n\n"
                f"Answer: {answer}\n\n"
                f"Sources:\n{_format_sources(chunks)}"
            )),
        ])
        parsed = json.loads(response.content.strip())
        verdict = parsed.get("verdict", "grounded")
        reason = parsed.get("reason", "")
        logger.info(f"[verify_node] verdict={verdict} reason='{reason}'")


        return{
            "verdict": verdict,
            "verify_reason": reason,
            "correction_attempts": state.get("correction_attempts", 0),
        }

    except Exception as exc:
        logger.warning(f"[verify_node] verification failed ({exc}); passing through")
        return {"verdict": "grounded", "correction_attempts": state.get("correction_attempts", 0)}


def should_retry(state: dict) -> dict:
    verdict = state.get("verdict", "grounded")
    attempts = state.get("correction_attempts", 0)

    if verdict == "ungrounded" and attempts < 1:
        logger.info("[should_retry] answer ungrounded, retrying with expanded retrieval")
        return "retry"
    return "done"


def expand_retrieval_node(state: dict) -> dict:
    return {
        "retrieval_k": settings.SELF_CORRECTION_EXPANDED_K,
        "correction_attempts": state.get("correction_attempts", 0) + 1,
    }

def finalize_node(state: dict) -> dict:
    verdict = state.get("verdict", "grounded")
    answer = state.get("answer", "")

    if verdict == "ungrounded":
        annotated = (
            f"{answer}\n\n"
            f"_Note: I couldn't fully verify this answer against the provided sources. "
            f"Treat it with caution._"
        )
        return {"answer": annotated}

    return {}