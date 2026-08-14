"use client";

import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SourceChunk } from "@/lib/rag";

export function Sources({ sources }: { sources: SourceChunk[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-surface-border bg-bg-muted/40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-xs font-medium text-text-muted hover:text-text"
      >
        <span className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          {sources.length} source{sources.length === 1 ? "" : "s"}
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-2 border-t border-surface-border p-3">
          {sources.map((s, i) => {
            const source =
              (s.metadata?.source as string) || `Source ${i + 1}`;
            const page = s.metadata?.page_number as number | undefined;
            return (
              <div
                key={i}
                className="rounded-md border border-surface-border bg-surface/50 p-3 text-xs"
              >
                <div className="mb-1.5 flex items-center justify-between text-text-muted">
                  <span className="font-medium text-text">
                    [{i + 1}] {source}
                    {page ? ` · page ${page}` : ""}
                  </span>
                  <span className="tabular-nums text-text-subtle">
                    {s.score.toFixed(3)}
                  </span>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-text-muted">
                  {s.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
