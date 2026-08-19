"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { MessageBubble, type ChatMessage } from "@/components/chat/message";
import { ScopeBar } from "@/components/chat/scope-bar";
import { queryApi } from "@/lib/rag";
import { ApiError } from "@/lib/api";
import { useScope } from "@/lib/scope-store";
import { usePipeline } from "@/lib/use-pipeline";

const SAMPLES = [
  "summarize the key points across every document in scope",
  "what are the main risks mentioned?",
  "list every deadline referenced with its date",
  "compare the recommendations in my two most recent uploads",
];

function ChatInner() {
  const [scope] = useScope();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const pipeline = usePipeline();

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pipeline.stages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  async function submit(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      at: new Date(),
      scopeCount: scope.size,
    };
    const loadingId = crypto.randomUUID();
    const loadingMsg: ChatMessage = {
      id: loadingId,
      role: "assistant",
      content: "",
      loading: true,
      pipelineStages: [],
      at: new Date(),
    };
    setMessages((m) => [...m, userMsg, loadingMsg]);
    setInput("");
    setSending(true);
    pipeline.start();

    try {
      const res = await queryApi.ask(text, {
        document_ids: scope.size > 0 ? [...scope] : undefined,
      });
      const finalStages = pipeline.finish();
      setMessages((m) =>
        m.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                loading: false,
                content: res.answer || "_(no answer generated)_",
                sources: res.sources,
                pipelineStages: finalStages,
              }
            : msg
        )
      );
    } catch (err) {
      pipeline.reset();
      const detail = err instanceof ApiError ? err.detail : "something went wrong";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === loadingId
            ? {
                ...msg,
                loading: false,
                content: `_error: ${detail}_`,
                pipelineStages: undefined,
              }
            : msg
        )
      );
      toast.error(detail);
    } finally {
      setSending(false);
    }
  }

  // keep the loading message's pipeline stages in sync while it runs
  useEffect(() => {
    if (!sending) return;
    setMessages((m) =>
      m.map((msg) =>
        msg.loading ? { ...msg, pipelineStages: pipeline.stages } : msg
      )
    );
  }, [pipeline.stages, sending]);

  return (
    <div className="flex h-[calc(100vh-2.75rem)] flex-col">
      {/* scope bar */}
      <div className="border-b border-chrome-border bg-chrome/40 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl">
          <ScopeBar />
        </div>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState onPick={(p) => submit(p)} scopeSize={scope.size} />
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>
      </div>

      {/* input */}
      <div className="border-t border-chrome-border bg-chrome/70 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="group flex items-end gap-2 rounded-md border border-chrome-border bg-bg-raised px-3 py-2 focus-within:border-prompt/50 focus-within:shadow-prompt"
          >
            <span className="mt-[7px] shrink-0 font-mono text-[13px] font-semibold text-prompt">
              ▸
            </span>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={
                scope.size > 0
                  ? `ask across ${scope.size} document${scope.size === 1 ? "" : "s"}…`
                  : "ask across your entire library…"
              }
              rows={1}
              disabled={sending}
              className="min-h-[24px] flex-1 resize-none bg-transparent py-1 font-mono text-[13.5px] text-ink placeholder:text-ink-faint focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="mt-0.5 shrink-0 rounded bg-gradient-to-b from-prompt to-prompt-soft px-2.5 py-1.5 font-mono text-[10.5px] font-semibold tracking-[0.14em] text-[#0b0616] shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:from-prompt/30 disabled:to-prompt-soft/30 disabled:text-[#0b0616]/40 disabled:shadow-none"
              aria-label="Send"
            >
              {sending ? "…" : "SEND ↵"}
            </button>
          </form>
          <p className="mt-2 text-center font-mono text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">
            answers cite only documents in scope · shift + return for newline
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  onPick,
  scopeSize,
}: {
  onPick: (prompt: string) => void;
  scopeSize: number;
}) {
  return (
    <div className="animate-slide-up rounded-md border border-chrome-border bg-bg-soft/70 shadow-block">
      <div className="border-b border-chrome-border px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.2em] text-ink-dim">
        <span className="text-prompt">◆</span> lumen · ready
        <span className="ml-3 text-ink-faint">v0.2 · rag pipeline online</span>
      </div>

      <div className="px-4 py-5 font-mono text-[13px] leading-relaxed text-ink">
        <p className="text-ink-dim">
          <span className="text-prompt">▸</span> booting session…
        </p>
        <p className="text-ink-dim">
          <span className="text-prompt">▸</span> loaded pipeline{" "}
          <span className="text-ink">desk → parse → embed → rank → reply</span>
        </p>
        <p className="text-ink-dim">
          <span className="text-prompt">▸</span> scope ={" "}
          {scopeSize > 0 ? (
            <span className="text-prompt">
              {scopeSize} document{scopeSize === 1 ? "" : "s"}
            </span>
          ) : (
            <>
              <span className="text-warn">unset</span>{" "}
              <Link href="/documents" className="text-prompt underline underline-offset-4 decoration-prompt/40 hover:text-prompt-glow">
                open library →
              </Link>
            </>
          )}
        </p>

        <p className="mt-4 text-ink">
          <span className="text-prompt">▸</span> ask anything, or start with a sample:
        </p>

        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {SAMPLES.map((s) => (
            <button
              key={s}
              onClick={() => onPick(s)}
              className="group flex items-start gap-2 rounded border border-chrome-border bg-bg-raised/60 px-3 py-2 text-left font-mono text-[12px] leading-relaxed text-ink-muted transition-all hover:border-prompt/40 hover:bg-prompt/[0.06] hover:text-ink"
            >
              <span className="mt-[3px] text-prompt opacity-60 group-hover:opacity-100">
                ▸
              </span>
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthProvider>
      <AppShell>
        <ChatInner />
      </AppShell>
    </AuthProvider>
  );
}
