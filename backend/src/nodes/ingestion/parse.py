import os

from pypdf import PdfReader
import pdfplumber
from collections import Counter
from docx import Document as DocxDocument

from src.interfaces.base_parser import BaseParser, ParsedUnit
from src.core.logging import get_logger



logger = get_logger(__name__)

class PdfParser(BaseParser):
    def supports(self, file_path: str) -> bool:
        return file_path.lower().endswith('.pdf')

    def parse(self, file_path: str) -> list[ParsedUnit]:
        with pdfplumber.open(file_path) as pdf:
            doc_meta = pdf.metadata or {}
            pages_text = []
            for page in pdf.pages:
                text = page.extract_text() or ""
                tables = page.extract_tables()
                if tables:
                    for t in tables:
                        rows = ["\t".join(str(cell or "") for cell in row) for row in t]
                        text += "\n\n[TABLE]\n" + "\n".join(rows)
                pages_text.append(text)

        pages_text = self._strip_repeated_headers_footers(pages_text)

        units = []
        for page_num, text in enumerate(pages_text):
            if text.strip():
                units.append(
                    ParsedUnit(
                        content=text,
                        metadata={
                            "page_number": page_num + 1,
                            "source": os.path.basename(file_path),
                            "doc_title": doc_meta.get("Title") or os.path.basename(file_path),
                            "doc_author": doc_meta.get("Author"),
                        },
                    )
                )
        return units

    def _strip_repeated_headers_footers(self, pages: list[str], min_pages: int = 3) -> list[str]:
        """Lines repeated across most pages are running headers/footers — drop them."""
        if len(pages) < min_pages:
            return pages
        first_lines = Counter(p.split("\n", 1)[0].strip() for p in pages if p.strip())
        last_lines = Counter(p.rstrip().rsplit("\n", 1)[-1].strip() for p in pages if p.strip())
        threshold = len(pages) * 0.6
        noisy = {ln for ln, c in first_lines.items() if c >= threshold and ln} | \
                {ln for ln, c in last_lines.items() if c >= threshold and ln}

        cleaned = []
        for p in pages:
            lines = [ln for ln in p.split("\n") if ln.strip() not in noisy]
            cleaned.append("\n".join(lines))
        return cleaned


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

