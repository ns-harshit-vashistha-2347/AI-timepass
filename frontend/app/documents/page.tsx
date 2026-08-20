"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Trash2, CloudUpload, Search, CheckCheck, X as XIcon } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { StatusBadge } from "@/components/ui/status-badge";
import { docsApi, type Document } from "@/lib/rag";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useScope } from "@/lib/scope-store";

const ACTIVE_STATUSES = new Set<Document["status"]>([
  "queued",
  "parsing",
  "chunking",
  "embedding",
  "storing",
]);

// map extension → monokai token color + tag
function fileMeta(name: string): { ext: string; color: string; kind: string } {
  const ext = (name.split(".").pop() || "").toLowerCase();
  switch (ext) {
    case "pdf":
      return { ext, color: "text-mk-pink", kind: "PDF" };
    case "docx":
    case "doc":
      return { ext, color: "text-mk-blue", kind: "DOC" };
    case "md":
    case "markdown":
      return { ext, color: "text-mk-green", kind: "MD " };
    case "txt":
      return { ext, color: "text-mk-yellow", kind: "TXT" };
    default:
      return { ext: ext || "bin", color: "text-mk-purple", kind: "BIN" };
  }
}

function formatBytes(n?: number): string {
  if (!n && n !== 0) return "  —  ";
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}K`;
  return `${(n / (1024 * 1024)).toFixed(1)}M`;
}

function DocumentsInner() {
  const [scope, store] = useScope();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState("");
  const [cursor, setCursor] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadDocs = useCallback(async () => {
    try {
      const data = await docsApi.list();
      setDocs(data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.detail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  useEffect(() => {
    const hasActive = docs.some((d) => ACTIVE_STATUSES.has(d.status));
    if (!hasActive) return;
    const t = setInterval(loadDocs, 2500);
    return () => clearInterval(t);
  }, [docs, loadDocs]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        try {
          await docsApi.upload(file);
          toast.success(`+ ${file.name}`);
        } catch (err) {
          const detail = err instanceof ApiError ? err.detail : "upload failed";
          toast.error(`${file.name}: ${detail}`);
        }
      }
      await loadDocs();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`rm "${name}" — irreversible. proceed?`)) return;
    try {
      await docsApi.delete(id);
      setDocs((d) => d.filter((doc) => doc.id !== id));
      store.remove(id);
      toast.success(`removed ${name}`);
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : "delete failed";
      toast.error(detail);
    }
  }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter((d) => d.filename.toLowerCase().includes(q));
  }, [docs, filter]);

  const ready = useMemo(() => docs.filter((d) => d.status === "completed"), [docs]);
  const inScope = ready.filter((d) => scope.has(d.id));

  function toggleAll() {
    if (inScope.length === ready.length) store.set([]);
    else store.set(ready.map((d) => d.id));
  }

  // keyboard-driven picker: j/k or arrows to move, space/enter to toggle, a = all, x = clear
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (filtered.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) => Math.min(filtered.length - 1, c + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const doc = filtered[cursor];
        if (doc && doc.status === "completed") store.toggle(doc.id);
      } else if (e.key === "a" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleAll();
      } else if (e.key === "d" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const doc = filtered[cursor];
        if (doc) remove(doc.id, doc.filename);
      } else if (e.key === "/") {
        e.preventDefault();
        (document.getElementById("doc-filter") as HTMLInputElement | null)?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, cursor, store]);

  // clamp cursor
  useEffect(() => {
    if (cursor >= filtered.length) setCursor(Math.max(0, filtered.length - 1));
  }, [filtered.length, cursor]);

  const totalChunks = docs.reduce((n, d) => n + (d.chunk_count || 0), 0);

  return (
    <div className="h-[calc(100vh-2.75rem)] overflow-y-auto bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-5 font-mono">
        {/* terminal window */}
        <div className="relative overflow-hidden rounded-md border border-chrome-border bg-bg-soft shadow-term">
          {/* title bar */}
          <div className="flex items-center gap-2 border-b border-chrome-border bg-chrome px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-mk-pink/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-mk-yellow/90" />
              <span className="h-2.5 w-2.5 rounded-full bg-mk-green/90" />
            </div>
            <div className="flex-1 text-center text-[10.5px] tracking-[0.16em] text-ink-faint">
              — lumen · library · ~/documents —
            </div>
            <span className="text-[10px] tracking-[0.16em] text-ink-faint">
              {docs.length} files
            </span>
          </div>

          {/* prompt + status ribbon */}
          <div className="border-b border-chrome-border bg-bg-soft px-4 py-3 text-[12.5px] leading-relaxed">
            <div>
              <span className="text-mk-green">lumen@rag</span>
              <span className="text-ink-faint">:</span>
              <span className="text-mk-blue">~/library</span>
              <span className="text-ink-faint">$ </span>
              <span className="text-mk-pink">ls</span>{" "}
              <span className="text-mk-purple">--scope</span>{" "}
              <span className="text-mk-yellow">"active"</span>
            </div>
            <div className="mt-1 text-[11px] text-ink-faint">
              <span className="text-mk-comment">
                # {ready.length} indexed · {inScope.length} in scope · {totalChunks} chunks
              </span>
            </div>
          </div>

          {/* action bar */}
          <div className="flex flex-wrap items-center gap-2 border-b border-chrome-border bg-bg-soft px-4 py-2.5">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mk-comment" />
              <input
                id="doc-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder='grep filename…  ( press "/" )'
                className="w-full rounded border border-chrome-border bg-bg py-1.5 pl-7 pr-3 text-[12px] text-ink placeholder:text-mk-comment focus:border-mk-pink focus:outline-none"
              />
            </div>

            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.docx,.md,.txt"
              className="hidden"
              onChange={(e) => upload(e.target.files)}
            />

            <button
              onClick={toggleAll}
              disabled={ready.length === 0}
              className="inline-flex items-center gap-1.5 rounded border border-chrome-border bg-bg px-2.5 py-1.5 text-[11px] text-mk-yellow hover:border-mk-yellow/60 hover:bg-mk-yellow/[0.06] disabled:opacity-40"
              title="a — toggle all in scope"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {inScope.length === ready.length && ready.length > 0 ? "scope --none" : "scope --all"}
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1.5 rounded border border-mk-pink/60 bg-mk-pink/10 px-2.5 py-1.5 text-[11px] font-semibold text-mk-pink hover:bg-mk-pink/20 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              {uploading ? "uploading…" : "upload +"}
            </button>
          </div>

          {/* dropzone rail — dashed border only when idle */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              upload(e.dataTransfer.files);
            }}
            className={cn(
              "border-b border-dashed px-4 py-2.5 text-center text-[11px] transition-colors",
              dragging
                ? "border-mk-pink bg-mk-pink/[0.08] text-mk-pink"
                : "border-chrome-border text-mk-comment"
            )}
          >
            {dragging ? (
              <span className="tracking-[0.2em]">
                <CloudUpload className="mr-1.5 inline h-3.5 w-3.5" />
                DROP TO IMPORT
              </span>
            ) : (
              <>
                <span className="text-mk-comment"># drag &amp; drop </span>
                <span className="text-mk-yellow">*.pdf</span>
                <span className="text-mk-comment"> | </span>
                <span className="text-mk-yellow">*.docx</span>
                <span className="text-mk-comment"> | </span>
                <span className="text-mk-yellow">*.md</span>
                <span className="text-mk-comment"> | </span>
                <span className="text-mk-yellow">*.txt</span>
                <span className="text-mk-comment"> — max 50M</span>
              </>
            )}
          </div>

          {/* file listing */}
          <div ref={listRef} className="bg-bg-soft">
            {/* column header */}
            <div className="grid grid-cols-[24px_44px_1fr_60px_100px_90px_28px] items-center gap-3 border-b border-chrome-border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] text-mk-comment">
              <span>[·]</span>
              <span>type</span>
              <span>filename</span>
              <span className="text-right">chunks</span>
              <span>modified</span>
              <span>status</span>
              <span />
            </div>

            {loading ? (
              <div className="px-4 py-10 text-center text-[12px] text-mk-comment">
                <span className="text-mk-pink">$</span> loading manifest
                <span className="caret text-mk-pink" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="px-4 py-14 text-center text-[12px] text-mk-comment">
                {docs.length === 0 ? (
                  <>
                    <div className="text-mk-yellow"># no files in this workspace</div>
                    <div className="mt-1">upload one above to bootstrap the corpus</div>
                  </>
                ) : (
                  <>
                    <span className="text-mk-pink">grep</span>: no match for{" "}
                    <span className="text-mk-yellow">"{filter}"</span>
                  </>
                )}
              </div>
            ) : (
              <ul>
                {filtered.map((doc, i) => {
                  const isReady = doc.status === "completed";
                  const isInScope = scope.has(doc.id);
                  const isCursor = i === cursor;
                  const meta = fileMeta(doc.filename);
                  return (
                    <li
                      key={doc.id}
                      onMouseEnter={() => setCursor(i)}
                      className={cn(
                        "group grid grid-cols-[24px_44px_1fr_60px_100px_90px_28px] items-center gap-3 border-l-2 px-3 py-1.5 text-[12px] transition-colors",
                        isCursor
                          ? "border-l-mk-pink bg-line/70"
                          : "border-l-transparent hover:bg-line/40",
                        isInScope && !isCursor && "bg-mk-green/[0.05]"
                      )}
                    >
                      {/* select bracket */}
                      <button
                        onClick={() => isReady && store.toggle(doc.id)}
                        disabled={!isReady}
                        aria-label={isInScope ? "remove from scope" : "add to scope"}
                        className={cn(
                          "text-[13px] font-bold tabular-nums transition-colors",
                          isInScope
                            ? "text-mk-green"
                            : isReady
                            ? "text-mk-comment hover:text-mk-pink"
                            : "text-mk-comment/40"
                        )}
                        title={
                          !isReady
                            ? "indexing…"
                            : isInScope
                            ? "in scope — click / space to toggle"
                            : "click / space to add to scope"
                        }
                      >
                        {isInScope ? "[x]" : "[ ]"}
                      </button>

                      {/* type chip */}
                      <span
                        className={cn(
                          "rounded-sm border border-current/40 bg-bg px-1.5 py-[1px] text-center text-[9.5px] font-bold tracking-[0.12em]",
                          meta.color
                        )}
                      >
                        {meta.kind}
                      </span>

                      {/* filename */}
                      <div className="min-w-0">
                        <span className={cn("truncate", isReady ? "text-ink" : "text-ink-dim")}>
                          {doc.filename}
                        </span>
                        {doc.error_message && (
                          <span className="ml-2 text-[10.5px] text-mk-pink">
                            × {doc.error_message}
                          </span>
                        )}
                      </div>

                      {/* chunks */}
                      <span className="text-right tabular-nums text-mk-purple">
                        {doc.chunk_count ? doc.chunk_count : <span className="text-mk-comment">—</span>}
                      </span>

                      {/* modified */}
                      <span className="truncate text-[10.5px] text-mk-comment">
                        {new Date(doc.created_at).toLocaleDateString()}{" "}
                        <span className="text-mk-comment/70">
                          {new Date(doc.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </span>

                      {/* status */}
                      <StatusBadge status={doc.status} />

                      {/* delete */}
                      <button
                        onClick={() => remove(doc.id, doc.filename)}
                        className="rounded p-1 text-mk-comment opacity-0 transition-opacity hover:bg-mk-pink/15 hover:text-mk-pink group-hover:opacity-100"
                        title="d — delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* footer status bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-chrome-border bg-chrome px-3 py-1.5 text-[10.5px] text-mk-comment">
              <div className="flex flex-wrap items-center gap-3">
                <Key label="j/k" desc="navigate" />
                <Key label="space" desc="scope" />
                <Key label="a" desc="all" />
                <Key label="d" desc="delete" />
                <Key label="/" desc="search" />
              </div>
              <div className="flex items-center gap-2">
                <span>
                  scope: <span className="text-mk-green">{inScope.length}</span>
                  <span className="text-mk-comment">/</span>
                  <span className="text-ink">{ready.length}</span>
                </span>
                {inScope.length > 0 && (
                  <button
                    onClick={() => store.set([])}
                    className="inline-flex items-center gap-1 rounded border border-chrome-border bg-bg-soft px-1.5 py-[1px] text-[10px] text-mk-pink hover:border-mk-pink/60"
                  >
                    <XIcon className="h-2.5 w-2.5" /> clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* selection preview strip */}
        {inScope.length > 0 && (
          <div className="mt-3 rounded-md border border-mk-green/40 bg-mk-green/[0.06] px-3 py-2 text-[11px] text-ink animate-slide-up">
            <div className="mb-1 text-[10px] uppercase tracking-[0.18em] text-mk-green">
              ▸ chat scope · {inScope.length} document{inScope.length === 1 ? "" : "s"}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {inScope.map((d) => (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1 rounded border border-mk-green/30 bg-bg-soft px-1.5 py-[2px] text-[10.5px] text-ink-muted"
                >
                  <span className="text-mk-green">▸</span>
                  <span className="max-w-[220px] truncate">{d.filename}</span>
                  <button
                    onClick={() => store.remove(d.id)}
                    className="text-mk-comment hover:text-mk-pink"
                    aria-label="remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Key({ label, desc }: { label: string; desc: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <kbd className="rounded border border-chrome-border bg-bg px-1 py-[1px] font-mono text-[9.5px] text-mk-yellow">
        {label}
      </kbd>
      <span className="text-mk-comment">{desc}</span>
    </span>
  );
}

export default function DocumentsPage() {
  return (
    <AuthProvider>
      <AppShell>
        <DocumentsInner />
      </AppShell>
    </AuthProvider>
  );
}
