import { api } from "./api";

export type DocumentStatus =
  | "queued"
  | "parsing"
  | "chunking"
  | "embedding"
  | "storing"
  | "completed"
  | "failed";

export interface Document {
  id: string;
  filename: string;
  status: DocumentStatus;
  chunk_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface SourceChunk {
  content: string;
  metadata: Record<string, unknown>;
  score: number;
}

export interface QueryResponse {
  answer: string;
  sources: SourceChunk[];
}

export const docsApi = {
  list: () => api.get<Document[]>("/documents"),
  upload: (file: File) =>
    api.upload<{ document_id: string; filename: string; status: DocumentStatus; task_id: string }>(
      "/documents/upload",
      file
    ),
  status: (id: string) => api.get<Document>(`/documents/${id}`),
  delete: (id: string) => api.del<void>(`/documents/${id}`),
};

export const queryApi = {
  ask: (query: string, opts: { top_k?: number; document_ids?: string[] } = {}) => {
    const { top_k = 5, document_ids } = opts;
    const body: Record<string, unknown> = { query, top_k };
    if (document_ids && document_ids.length > 0) body.document_ids = document_ids;
    return api.post<QueryResponse>("/query", body);
  },
};
