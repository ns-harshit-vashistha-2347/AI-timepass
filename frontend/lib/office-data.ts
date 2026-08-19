import type { GraphTopology } from "./graph-layout";

export type DeskStatus = "idle" | "active" | "done";

export interface Department {
  id: string;
  label: string;
  description: string;
  icon: "code" | "scale";
  topology: GraphTopology;
}

// Mirrors src/graphs/query_graph.py exactly — rewrite -> [dense, bm25] ->
// fusion -> rerank -> compression -> generation -> verify. Once the
// backend exposes GET /departments/{id}/topology this becomes a fetch
// instead of a literal, and the layout code below doesn't change at all.
const CODEBASE_TOPOLOGY: GraphTopology = {
  nodes: [
    { id: "rewrite", label: "rewrite" },
    { id: "dense", label: "dense" },
    { id: "bm25", label: "bm25" },
    { id: "fusion", label: "fusion" },
    { id: "rerank", label: "rerank" },
    { id: "compression", label: "compress" },
    { id: "generation", label: "generate" },
    { id: "verify", label: "verify" },
  ],
  edges: [
    { from: "rewrite", to: "dense" },
    { from: "rewrite", to: "bm25" },
    { from: "dense", to: "fusion" },
    { from: "bm25", to: "fusion" },
    { from: "fusion", to: "rerank" },
    { from: "rerank", to: "compression" },
    { from: "compression", to: "generation" },
    { from: "generation", to: "verify" },
  ],
};

// A second, differently-shaped department to prove the layout isn't
// hand-placed per room. Mirrors an ingestion-style pipeline.
const LEGAL_TOPOLOGY: GraphTopology = {
  nodes: [
    { id: "parse", label: "parse" },
    { id: "chunk", label: "chunk" },
    { id: "embed", label: "embed" },
    { id: "store", label: "store" },
  ],
  edges: [
    { from: "parse", to: "chunk" },
    { from: "chunk", to: "embed" },
    { from: "embed", to: "store" },
  ],
};

export const DEPARTMENTS: Department[] = [
  {
    id: "codebase",
    label: "Codebase intel",
    description: "Source, architecture and technical questions",
    icon: "code",
    topology: CODEBASE_TOPOLOGY,
  },
  {
    id: "legal",
    label: "Legal and docs",
    description: "Contracts, policies and compliance",
    icon: "scale",
    topology: LEGAL_TOPOLOGY,
  },
];
