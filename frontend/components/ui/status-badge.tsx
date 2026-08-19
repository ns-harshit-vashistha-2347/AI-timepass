import { cn } from "@/lib/cn";
import type { DocumentStatus } from "@/lib/rag";

const styles: Record<DocumentStatus, string> = {
  queued: "text-warn border-warn/40 bg-warn/5",
  parsing: "text-prompt border-prompt/40 bg-prompt/5",
  chunking: "text-prompt border-prompt/40 bg-prompt/5",
  embedding: "text-prompt border-prompt/40 bg-prompt/5",
  storing: "text-prompt border-prompt/40 bg-prompt/5",
  completed: "text-ok border-ok/40 bg-ok/5",
  failed: "text-danger border-danger/40 bg-danger/5",
};

const labels: Record<DocumentStatus, string> = {
  queued: "QUEUED",
  parsing: "PARSE",
  chunking: "CHUNK",
  embedding: "EMBED",
  storing: "STORE",
  completed: "READY",
  failed: "FAILED",
};

const PROCESSING = new Set<DocumentStatus>([
  "queued",
  "parsing",
  "chunking",
  "embedding",
  "storing",
]);

export function StatusBadge({ status }: { status: DocumentStatus }) {
  const isProcessing = PROCESSING.has(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 py-[3px] font-mono text-[10px] font-semibold tracking-[0.14em]",
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
