from abc import ABC, abstractmethod
from dataclasses import dataclass, field

from src.interfaces.base_parser import ParsedUnit

@dataclass
class Chunk:
    id: str
    content: str
    metadata: dict = field(default_factory=dict)


class BaseChunker(ABC):
    @abstractmethod
    def chunk(self, units: list[ParsedUnit], *, document_id: str) -> list[Chunk]:
        ...