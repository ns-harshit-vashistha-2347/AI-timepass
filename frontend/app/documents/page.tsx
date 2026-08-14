"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, Trash2, FileText, CloudUpload } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { docsApi, type Document } from "@/lib/rag";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/cn";

const ACTIVE_STATUSES = new Set([
  "queued",
  "parsing",
  "chunking",
  "embedding",
  "storing",
]);

function DocumentsInner() {
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

  // poll while any doc is still processing
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
          toast.success(`Uploaded ${file.name}`);
        } catch (err) {
          const detail = err instanceof ApiError ? err.detail : "Upload failed";
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
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await docsApi.delete(id);
      setDocs((d) => d.filter((doc) => doc.id !== id));
      toast.success("Document deleted");
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : "Delete failed";
      toast.error(detail);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
            <p className="mt-1 text-sm text-text-muted">
              Upload PDF, DOCX, Markdown, or plain text. Max 50 MB per file.
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.md,.txt"
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <Button
            onClick={() => fileRef.current?.click()}
            loading={uploading}
            size="md"
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>
        </div>

        {/* Dropzone */}
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
            "mb-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-surface-border bg-surface/30 py-12 transition-all",
            dragging && "border-accent bg-accent/5"
          )}
        >
          <CloudUpload
            className={cn(
              "mb-3 h-8 w-8 transition-colors",
              dragging ? "text-accent" : "text-text-muted"
            )}
          />
          <p className="text-sm font-medium text-text">
            {dragging ? "Drop to upload" : "Drop files here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-text-subtle">
            PDF · DOCX · MD · TXT
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : docs.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-text-subtle" />
            <p className="mt-3 text-sm text-text-muted">
              No documents yet. Upload one to get started.
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {docs.map((doc) => (
              <Card
                key={doc.id}
                className="flex items-center gap-4 p-4 hover:bg-surface-hover transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent-glow">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">
                    {doc.filename}
                  </p>
                  <p className="mt-0.5 text-xs text-text-subtle">
                    {doc.chunk_count > 0
                      ? `${doc.chunk_count} chunks · `
                      : ""}
                    {new Date(doc.created_at).toLocaleString()}
                  </p>
                  {doc.error_message && (
                    <p className="mt-1 text-xs text-danger">
                      {doc.error_message}
                    </p>
                  )}
                </div>
                <StatusBadge status={doc.status} />
                <button
                  onClick={() => remove(doc.id, doc.filename)}
                  className="rounded-md p-2 text-text-subtle hover:bg-danger/10 hover:text-danger transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
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
