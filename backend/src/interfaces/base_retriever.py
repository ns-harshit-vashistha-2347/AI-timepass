from abc import ABC, abstractmethod
from dataclasses import dataclass, field



@dataclass
class RetrievedChunk():
    id: str
    content: str
    metadata: dict = field(default_factory=dict)
    score: float = 0.0


class BaseRetriever(ABC):
    @abstractmethod
    def retrieve(self, query: str, top_k: int = 5) -> list[RetrievedChunk]:
        ...


