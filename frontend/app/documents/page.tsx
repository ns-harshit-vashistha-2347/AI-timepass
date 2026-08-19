"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Upload, Trash2, FileText, CloudUpload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
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

function DocumentsInner() {
  const [scope, store] = useScope();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
          toast.success(`uploaded ${file.name}`);
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
    if (!confirm(`delete "${name}"? this cannot be undone.`)) return;
    try {
      await docsApi.delete(id);
      setDocs((d) => d.filter((doc) => doc.id !== id));
      store.remove(id);
      toast.success("document deleted");
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : "delete failed";
      toast.error(detail);
    }
  }

  const ready = useMemo(() => docs.filter((d) => d.status === "completed"), [docs]);
  const inScope = ready.filter((d) => scope.has(d.id));

  function toggleAll() {
    if (inScope.length === ready.length) store.set([]);
    else store.set(ready.map((d) => d.id));
  }

  return (
    <div className="h-[calc(100vh-2.75rem)] overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* header block */}
        <div className="mb-4 overflow-hidden rounded-md border border-chrome-border bg-bg-soft/70 shadow-block">
          <div className="border-b border-chrome-border bg-chrome/60 px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-dim">
            <span className="text-prompt">◆</span> library ·{" "}
            <span className="text-ink">{docs.length}</span> file
            {docs.length === 1 ? "" : "s"} ·{" "}
            <span className="text-prompt">
              {inScope.length}
            </span>{" "}
            in scope
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div>
              <h1 className="font-mono text-[16px] font-semibold tracking-tight text-ink">
                <span className="text-prompt">▸</span> library
              </h1>
              <p className="mt-1 font-mono text-[11.5px] text-ink-dim">
                upload documents, then tick <span className="text-prompt">SCOPE</span> to include
                them in chat.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.docx,.md,.txt"
                className="hidden"
                onChange={(e) => upload(e.target.files)}
              />
              {ready.length > 0 && (
                <Button variant="secondary" size="sm" onClick={toggleAll}>
                  {inScope.length === ready.length ? "CLEAR SCOPE" : "SCOPE ALL"}
                </Button>
              )}
              <Button
                onClick={() => fileRef.current?.click()}
                loading={uploading}
                size="sm"
              >
                <Upload className="h-3.5 w-3.5" />
                UPLOAD
              </Button>
            </div>
          </div>
        </div>

        {/* dropzone */}
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
          onClick={() => fileRef.current?.click()}
          className={cn(
            "mb-4 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-chrome-border bg-bg-soft/40 py-8 transition-all",
            dragging && "border-prompt bg-prompt/[0.06]"
          )}
        >
          <CloudUpload
            className={cn(
              "mb-2 h-6 w-6 transition-colors",
              dragging ? "text-prompt" : "text-ink-dim"
            )}
          />
          <p className="font-mono text-[12.5px] text-ink">
            {dragging ? "drop to upload" : "drop files here or click to browse"}
          </p>
          <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">
            pdf · docx · md · txt · max 50mb
          </p>
        </div>

        {/* list */}
        {loading ? (
          <div className="flex justify-center py-10 font-mono text-[11px] tracking-[0.18em] text-ink-dim">
            LOADING<span className="caret" />
          </div>
        ) : docs.length === 0 ? (
          <div className="rounded-md border border-chrome-border bg-bg-soft/50 p-10 text-center">
            <FileText className="mx-auto h-6 w-6 text-ink-faint" />
            <p className="mt-3 font-mono text-[12.5px] text-ink-dim">
              no documents yet. upload one to get started.
            </p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {docs.map((doc) => {
              const isReady = doc.status === "completed";
              const isInScope = scope.has(doc.id);
              return (
                <li
                  key={doc.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors",
                    isInScope
                      ? "border-prompt/40 bg-prompt/[0.06]"
                      : "border-chrome-border bg-bg-soft/60 hover:bg-chrome/60"
                  )}
                >
                  {/* scope checkbox */}
                  <button
                    onClick={() => isReady && store.toggle(doc.id)}
                    disabled={!isReady}
                    aria-label={isInScope ? "remove from scope" : "add to scope"}
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[11px] transition-colors",
                      isInScope
                        ? "border-prompt bg-prompt text-[#0b0616]"
                        : isReady
                        ? "border-chrome-border hover:border-prompt/60"
                        : "border-chrome-border/60 opacity-40"
                    )}
                    title={
                      !isReady
                        ? "not ready yet"
                        : isInScope
                        ? "in scope · click to remove"
                        : "click to add to chat scope"
                    }
                  >
                    {isInScope ? "✓" : ""}
                  </button>

                  <FileText className="h-4 w-4 shrink-0 text-prompt" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[12.5px] text-ink">
                      {doc.filename}
                    </p>
                    <p className="mt-0.5 font-mono text-[10.5px] text-ink-dim">
                      {doc.chunk_count > 0 && (
                        <>
                          <span className="text-prompt">{doc.chunk_count}</span>ch ·{" "}
                        </>
                      )}
                      {new Date(doc.created_at).toLocaleString()}
                    </p>
                    {doc.error_message && (
                      <p className="mt-1 font-mono text-[10.5px] text-danger">
                        {doc.error_message}
                      </p>
                    )}
                  </div>

                  <StatusBadge status={doc.status} />

                  <button
                    onClick={() => remove(doc.id, doc.filename)}
                    className="rounded p-1.5 text-ink-dim transition-colors hover:bg-danger/10 hover:text-danger"
                    title="delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
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
