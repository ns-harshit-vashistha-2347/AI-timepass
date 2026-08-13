from abc import ABC, abstractmethod
from dataclasses import dataclass, field

@dataclass
class ParsedUnit:
    content: str
    metadata: dict = field(default_factory=dict)


class BaseParser(ABC):
    @abstractmethod
    def supports(self, file_path: str) -> bool:
        """Whether this parser can handle the given file."""
        ...

    @abstractmethod
    def parse(self, file_path: str) -> list[ParsedUnit]:
        ...