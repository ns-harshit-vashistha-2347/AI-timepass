from functools import lru_cache

from src.core.config import settings

import hashlib
import json
import redis


@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.Redis.from_url(url=settings.REDIS_URL, decode_responses=True)


def bm25_version_key(collection_name: str) -> str:
    return f"bm25:corpus_version:{collection_name}"


def bump_bm25_version(collection_name: str) -> None:
    get_redis_client().incr(bm25_version_key(collection_name))


def get_bm25_version(collection_name: str) -> str:
    value = get_redis_client().get(bm25_version_key(collection_name))
    return value or "0"


def query_cache_key(query: str, top_k: int, user_id: str) -> str:
    normalized = query.strip().lower()
    digest = hashlib.sha256(f"{user_id}:{top_k}:{normalized}".encode()).hexdigest()
    return f"query_cache:{digest}"


def get_cached_query(query: str, top_k: int, user_id: str) -> dict | None:
    raw = get_redis_client().get(query_cache_key(query, top_k, user_id))
    return json.loads(raw) if raw else None


def set_cached_query(query: str, top_k: int, user_id: str, payload: dict, ttl: int = 3600) -> None:
    get_redis_client().set(query_cache_key(query, top_k, user_id), json.dumps(payload), ex=ttl)