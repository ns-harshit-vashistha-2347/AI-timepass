import hashlib


from langchain_text_splitters import (
    MarkdownHeaderTextSplitter,
    RecursiveCharacterTextSplitter,
)

from src.core.logging import get_logger
from src.interfaces.base_chunker import BaseChunker, Chunk
from src.interfaces.base_parser import ParsedUnit



logger = get_logger(__name__)

MARKDOWN_HEADERS_TO_SPLIT_ON = [
    ("#", "h1"),
    ("##", "h2"),
    ("###", "h3"),
]


def _deterministic_chunk_id(document_id: str, unit_index: int, chunk_index: int) -> str:
    raw = f"{document_id}:{unit_index}:{chunk_index}"
    logger.debug(f"Generated deterministic chunk ID: {raw}")
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class RecursiveTokenChunker(BaseChunker):
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        self.markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=MARKDOWN_HEADERS_TO_SPLIT_ON,
        )

        self.token_splitter = (
            RecursiveCharacterTextSplitter.from_tiktoken_encoder(
                encoding_name="cl100k_base",
                chunk_size=self.chunk_size,
                chunk_overlap=self.chunk_overlap,
            )
        )

    def _looks_like_markdown(self, text: str) -> bool:
        return any(
            header in text
            for header, _ in MARKDOWN_HEADERS_TO_SPLIT_ON
        )

    def _build_context_header(self, metadata: dict) -> str:
        """Builds a short 'breadcrumb' string (source + section path) to prepend
        to a chunk before embedding, so an isolated chunk doesn't lose the
        surrounding context that made it meaningful."""
        parts: list[str] = []

        source = metadata.get("source")
        page = metadata.get("page_number")
        if source:
            parts.append(f"Source: {source}" + (f" (page {page})" if page else ""))

        section_path = " > ".join(
            metadata[key] for key in ("h1", "h2", "h3") if metadata.get(key)
        )
        if section_path:
            parts.append(f"Section: {section_path}")

        return "\n".join(parts)

    def chunk(
        self,
        units: list[ParsedUnit],
        *,
        document_id: str,
        user_id: str | None = None,
    ) -> list[Chunk]:

        chunks: list[Chunk] = []
        chunk_index = 0

        for unit_index, unit in enumerate(units):

            if self._looks_like_markdown(unit.content):
                sections = self.markdown_splitter.split_text(
                    unit.content
                )

                section_texts = [
                    section.page_content
                    for section in sections
                ]

                section_metadatas = [
                    section.metadata
                    for section in sections
                ]

            else:
                section_texts = [unit.content]
                section_metadatas = [{}]

            for text, metadata in zip(
                section_texts,
                section_metadatas
            ):

                section_chunks = self.token_splitter.split_text(text)

                for chunk_text in section_chunks:

                    combined_metadata = {
                        **unit.metadata,
                        **metadata,
                        "document_id": document_id,
                        "chunk_index": chunk_index,
                    }
                    if user_id is not None:
                        combined_metadata["user_id"] = user_id

                    header = self._build_context_header(combined_metadata)
                    embedded_text = f"{header}\n\n{chunk_text}" if header else chunk_text

                    chunks.append(
                        Chunk(
                            id=_deterministic_chunk_id(
                                document_id,
                                unit_index,
                                chunk_index,
                            ),
                            content=embedded_text,
                            metadata={
                                **combined_metadata,
                                "raw_content": chunk_text,
                                "context_header": header,
                            },
                        )
                    )

                    chunk_index += 1

        return chunks
    

def chunk_node(state: dict) -> dict:
    document_id = state["document_id"]
    user_id = state.get("user_id")
    units = state["parsed_units"]
    logger.info(f"Chunking {len(units)} parsed units for document {document_id}")

    chunker = RecursiveTokenChunker()
    chunks = chunker.chunk(units, document_id=document_id, user_id=user_id)

    if not chunks:
        raise ValueError(f"No chunks were created for document {document_id}. Please check the input data.")

    logger.info(f"Created {len(chunks)} chunks for document {document_id}")
    return {**state, "chunks": chunks}