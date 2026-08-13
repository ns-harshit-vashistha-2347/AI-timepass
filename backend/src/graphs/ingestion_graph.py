from typing import Any, TypedDict


from langgraph.graph import START, END, StateGraph


from src.nodes.ingestion.chunk import chunk_node
from src.nodes.ingestion.embed import embed_node
from src.nodes.ingestion.parse import parse_node
from src.nodes.ingestion.store import store_node


class IngestionState(TypedDict, total=False):
    document_id: str
    file_path: str
    source_type: str
    parsed_units: list[Any]
    chunks: list[Any]
    embeddings: list[list[float]]
    stored_chunk_count: int


def build_ingestion_graph():
    graph = StateGraph(IngestionState)

    graph.add_node("parse", parse_node)
    graph.add_node("chunk", chunk_node)
    graph.add_node("embed", embed_node)
    graph.add_node("store", store_node)

    graph.add_edge(START, "parse")
    graph.add_edge("parse", "chunk")
    graph.add_edge("chunk", "embed")
    graph.add_edge("embed", "store")
    graph.add_edge("store", END)

    return graph.compile()


ingestion_graph = build_ingestion_graph()


