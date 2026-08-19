"use client";

import Link from "next/link";
import { X, Plus } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";
import { docsApi, type Document } from "@/lib/rag";
import { ApiError } from "@/lib/api";
import { useScope } from "@/lib/scope-store";

export function ScopeBar() {
  const [scope, store] = useScope();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    docsApi
      .list()
      .then((d) => {
        if (!cancelled) setDocs(d);
      })
      .catch((err) => {
        if (!(err instanceof ApiError)) throw err;
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = docs.filter((d) => d.status === "completed");
  const inScope = ready.filter((d) => scope.has(d.id));

  return (
    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
      <span className="text-ink-dim">
        <span className="text-prompt">scope</span>{" "}
        <span className="text-ink-faint">▸</span>
      </span>

      {loading ? (
        <span className="text-ink-faint">loading…</span>
      ) : inScope.length === 0 ? (
        <span className="text-ink-faint">
          {ready.length === 0
            ? "no ready documents · upload in library"
            : "all documents (no filter)"}
        </span>
      ) : (
        inScope.map((d) => (
          <button
            key={d.id}
            onClick={() => store.remove(d.id)}
            className="group flex items-center gap-1 rounded border border-prompt/40 bg-prompt/10 px-2 py-[3px] text-prompt hover:bg-prompt/15"
            title="Remove from scope"
          >
            <span className="max-w-[180px] truncate">{d.filename}</span>
            <X className="h-3 w-3 opacity-60 group-hover:opacity-100" />
          </button>
        ))
      )}

      <Link
        href="/documents"
        className="ml-1 inline-flex items-center gap-1 rounded border border-dashed border-chrome-border px-2 py-[3px] text-ink-dim hover:border-prompt/40 hover:text-prompt"
      >
        <Plus className="h-3 w-3" />
        {inScope.length === 0 ? "select docs" : "edit"}
      </Link>
    </div>
  );
}
