import os

from pypdf import PdfReader
from docx import Document as DocxDocument

from src.interfaces.base_parser import BaseParser, ParsedUnit
from src.core.logging import get_logger



logger = get_logger(__name__)


class PdfParser(BaseParser):
    def supports(self, file_path: str) -> bool:
        return file_path.lower().endswith('.pdf')

    def parse(self, file_path: str) -> list[ParsedUnit]:
        reader = PdfReader(file_path)
        units = []
        for page_num, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                units.append(
                    ParsedUnit(
                        content=text,
                        metadata={
                            "page_number": page_num + 1,
                            "source": os.path.basename(file_path),
                        },
                    )
                )

        return units


class DocxParser(BaseParser):
    def supports(self, file_path: str) -> bool:
        return file_path.lower().endswith('.docx')

    def parse(self, file_path: str) -> list[ParsedUnit]:
        doc = DocxDocument(file_path)
        text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
        return [
            ParsedUnit(
                content=text,
                metadata={
                    "source": os.path.basename(file_path),
                },
            )
        ]

class MarkdownTextParser(BaseParser):
    def supports(self, file_path: str) -> bool:
        return file_path.lower().endswith((".md", ".txt"))

    def parse(self, file_path: str) -> list[ParsedUnit]:
        with open(file_path, encoding="utf-8") as f:
            text = f.read()
        return [ParsedUnit(content=text, metadata={"source": os.path.basename(file_path)})]


DOCUMENT_PARSERS: list[BaseParser] = [
    PdfParser(),
    DocxParser(),
    MarkdownTextParser(),
]

def get_parser(file_path: str) -> BaseParser:
    for parser in DOCUMENT_PARSERS:
        if parser.supports(file_path):
            return parser
    raise ValueError(f"No parser registered for file: {file_path}")


def parse_node(state: dict) -> dict:
    file_path = state.get("file_path")
    if not file_path:
        raise ValueError("file_path is required in the state.")

    logger.info(f"Parsing file: {file_path}")
    parser = get_parser(file_path)
    units = parser.parse(file_path)
    if not units:
        raise ValueError(f"No content extracted from file: {file_path}")

    return {**state, "parsed_units": units}

