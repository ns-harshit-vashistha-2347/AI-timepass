import { cn } from "@/lib/cn";
import type { DocumentStatus } from "@/lib/rag";

const styles: Record<DocumentStatus, string> = {
  queued: "bg-warn/15 text-warn border-warn/30",
  parsing: "bg-accent/15 text-accent-glow border-accent/30",
  chunking: "bg-accent/15 text-accent-glow border-accent/30",
  embedding: "bg-accent/15 text-accent-glow border-accent/30",
  storing: "bg-accent/15 text-accent-glow border-accent/30",
  completed: "bg-success/15 text-success border-success/30",
  failed: "bg-danger/15 text-danger border-danger/30",
};

const labels: Record<DocumentStatus, string> = {
  queued: "Queued",
  parsing: "Parsing",
  chunking: "Chunking",
  embedding: "Embedding",
  storing: "Storing",
  completed: "Ready",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const isProcessing = ["queued", "parsing", "chunking", "embedding", "storing"].includes(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status]
      )}
    >
      {isProcessing && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {labels[status]}
    </span>
  );
}
