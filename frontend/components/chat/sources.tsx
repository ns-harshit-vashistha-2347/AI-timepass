"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SourceChunk } from "@/lib/rag";

export function Sources({ sources }: { sources: SourceChunk[] }) {
  const [open, setOpen] = useState(false);
  if (!sources.length) return null;

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-dim hover:text-prompt"
      >
        <span className="text-prompt">cite</span>
        <span className="text-ink-faint">▸</span>
        <span>{sources.length} source{sources.length === 1 ? "" : "s"}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="mt-2 space-y-1.5">
          {sources.map((s, i) => {
            const source = (s.metadata?.source as string) || `source ${i + 1}`;
            const page = s.metadata?.page_number as number | undefined;
            return (
              <div
                key={i}
                className="rounded border border-chrome-border bg-bg/50 p-2.5 font-mono text-[11.5px] leading-relaxed"
              >
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em]">
                  <span className="text-prompt">
                    [{String(i + 1).padStart(2, "0")}] {source}
                    {page ? ` · p${page}` : ""}
                  </span>
                  <span className="tabular-nums text-ink-faint">
                    score {s.score.toFixed(3)}
                  </span>
                </div>
                <p className="line-clamp-4 whitespace-pre-wrap text-ink-muted">
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
