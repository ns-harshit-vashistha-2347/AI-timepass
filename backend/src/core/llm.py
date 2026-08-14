from functools import lru_cache
from typing import Literal

from src.core.config import settings

from langchain_groq import ChatGroq


TaskTier = Literal["small", "medium", "large"]

TASK_TO_TIER: dict[str, TaskTier] = {
    "classify": "small",    
    "rewrite": "small",      
    "compress": "small",    
    "verify": "small",      
    "generate_simple": "medium",
    "generate_complex": "large",
    "default": "medium",
}

def _model_for_tier(tier: TaskTier) -> str:
    return {
        "small": settings.GROQ_MODEL_SMALL,
        "medium": settings.GROQ_MODEL_MEDIUM,
        "large": settings.GROQ_MODEL_LARGE,
    }[tier]

@lru_cache
def _get_llm_cached(model: str, temperature: float) -> ChatGroq:
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model=model,
        temperature=temperature,
    )


def get_llm(task: str = "default", temperature: float = 0.2) -> ChatGroq:
    tier = TASK_TO_TIER.get(task, "medium")
    model = _model_for_tier(tier)
    return _get_llm_cached(model, temperature)




