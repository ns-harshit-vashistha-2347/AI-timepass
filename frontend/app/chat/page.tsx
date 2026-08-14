"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { MessageBubble, type ChatMessage } from "@/components/chat/message";
import { Button } from "@/components/ui/button";
import { queryApi } from "@/lib/rag";
import { ApiError } from "@/lib/api";

const SAMPLES = [
  "Summarize the key points across all my documents",
  "What are the main risks mentioned?",
  "List every deadline referenced with its date",
  "Compare the recommendations in my two most recent uploads",
];

function ChatInner() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

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
    };
    const loadingMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      loading: true,
    };
    setMessages((m) => [...m, userMsg, loadingMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await queryApi.ask(text);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === loadingMsg.id
            ? {
                ...msg,
                loading: false,
                content: res.answer || "_(no answer generated)_",
                sources: res.sources,
              }
            : msg
        )
      );
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : "Something went wrong";
      setMessages((m) =>
        m.map((msg) =>
          msg.id === loadingMsg.id
            ? {
                ...msg,
                loading: false,
                content: `_Error: ${detail}_`,
              }
            : msg
        )
      );
      toast.error(detail);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <EmptyState onPick={(p) => submit(p)} />
          ) : (
            <div className="space-y-6">
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-surface-border bg-bg-soft/60 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="relative"
          >
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
              placeholder="Ask anything about your documents…"
              rows={1}
              className="w-full resize-none rounded-xl border border-surface-border bg-surface px-4 py-3 pr-14 text-sm text-text placeholder:text-text-subtle focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || sending}
              loading={sending}
              className="absolute bottom-2 right-2 h-9 w-9 p-0"
              aria-label="Send"
            >
              {!sending && <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="mt-2 text-center text-xs text-text-subtle">
            Answers use only your uploaded documents. Sources shown per answer.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center animate-slide-up">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-soft glow">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">
        What can I help you find?
      </h1>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        Ask a question and I&apos;ll search across your uploaded documents. Start with a sample or type your own.
      </p>

      <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-lg border border-surface-border bg-surface/50 px-4 py-3 text-left text-sm text-text-muted hover:border-accent/40 hover:bg-surface hover:text-text transition-all"
          >
            {s}
          </button>
        ))}
      </div>

      <Link
        href="/documents"
        className="mt-8 text-xs text-text-subtle hover:text-accent-glow"
      >
        No documents yet? Upload some →
      </Link>
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
