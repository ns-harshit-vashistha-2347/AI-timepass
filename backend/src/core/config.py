from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    PROJECT_NAME: str = "AI World Backend"
    APP_NAME: str = "AI World Backend"
    ENV: str = "local"

    POSTGRES_USER: str = "world"
    POSTGRES_PASSWORD: str = "world"
    POSTGRES_HOST: str = "postgres"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "world"

    @property
    def POSTGRES_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379

    @property
    def SYNC_POSTGRES_URL_STR(self) -> str:
        return f"postgresql+psycopg2://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"


    @property
    def REDIS_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    @property
    def CELERY_BROKER_URL(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/1"

    @property
    def CELERY_RESULT_BACKEND(self) -> str:
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/2"


    CHROMA_HOST: str = "chromadb"
    CHROMA_PORT: int = 8000
    CHROMA_COLLECTION_DOCUMENTS: str = "documents"

    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    UPLOAD_DIR: str = "/data/uploads"

    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 150

    RETRIEVAL_TOP_K: int = 5
    RRF_K: int = 60


    RERANK_ENABLED: bool = True
    RERANK_MODEL: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"
    RERANK_CANDIDATE_POOL: int = 20
    RERANK_TOP_N: int = 5


    BM25_CACHE_TTL_SECONDS: int = 300

    MAX_UPLOAD_SIZE_MB: int = 50

    QUERY_REWRITE_ENABLED: bool = True
    QUERY_EXPANSION_COUNT: int = 2

    COMPRESSION_ENABLED: bool = True

    SELF_CORRECTION_ENABLED: bool = True
    SELF_CORRECTION_EXPANDED_K: int = 10


    ALLOWED_EXTENSIONS: str = ".pdf,.docx,.md,.txt"

    @property
    def allowed_extensions(self) -> frozenset[str]:
        return frozenset(
            ext.strip().lower() if ext.strip().startswith(".") else f".{ext.strip().lower()}"
            for ext in self.ALLOWED_EXTENSIONS.split(",")
            if ext.strip()
        )


@lru_cache()
def get_settings() -> Settings:
    return Settings()

settings = get_settings()