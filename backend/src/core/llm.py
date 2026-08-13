from functools import lru_cache

from src.core.config import settings

from langchain_groq import ChatGroq

@lru_cache
def get_llm(temperature: float = 0.2):
    return ChatGroq(
        api_key=settings.GROQ_API_KEY,
        model_name=settings.GROQ_MODEL,
        temperature=temperature
    )
