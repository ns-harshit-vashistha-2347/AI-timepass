from functools import lru_cache

from src.core.config import settings

import redis


@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.Redis.from_url(url=settings.REDIS_URL, decode_response = True)


def bm25_version_key(collection_name: str) -> str:
    return f"bm25:corpus_version:{collection_name}"


def bump_bm25_version(collection_name: str) -> None:
    get_redis_client().incr(bm25_version_key(collection_name))


def get_bm25_version(collection_name: str) -> str:
    value = get_redis_client().get(bm25_version_key(collection_name))
    return value or "0"