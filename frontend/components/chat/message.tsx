"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/cn";
import type { SourceChunk } from "@/lib/rag";
import type { Stage } from "@/lib/use-pipeline";
import { Sources } from "./sources";
import { Pipeline } from "./pipeline";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  loading?: boolean;
  pipelineStages?: Stage[];
  scopeCount?: number;
  at?: Date;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <article
      className={cn(
        "overflow-hidden rounded-md border animate-fade-in",
        isUser
          ? "border-prompt/30 bg-prompt/[0.06]"
          : "border-chrome-border bg-bg-soft/70"
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b px-3.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em]",
          isUser
            ? "border-prompt/25 text-prompt"
            : "border-chrome-border text-ink-dim"
        )}
      >
        <span className="flex items-center gap-2">
          <span className={cn(isUser ? "text-prompt" : "text-ok")}>
            {isUser ? "▸" : "◆"}
          </span>
          <span className="font-semibold">
            {isUser ? "you" : "lumen"}
          </span>
          {!isUser && message.loading && (
            <span className="text-prompt normal-case tracking-normal">
              · agent working
            </span>
          )}
          {!isUser && !message.loading && message.pipelineStages && (
            <span className="text-ok normal-case tracking-normal">· done</span>
          )}
        </span>
        <span className="text-ink-faint">
          {message.at
            ? message.at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
            : ""}
          {isUser && message.scopeCount != null && (
            <span className="ml-3">
              scope <span className="text-prompt">{message.scopeCount || "all"}</span>
            </span>
          )}
        </span>
      </header>

      <div className="px-3.5 py-3">
        {isUser ? (
          <p className="whitespace-pre-wrap font-mono text-[13.5px] leading-relaxed text-ink">
            {message.content}
          </p>
        ) : message.loading ? (
          <LoadingBody stages={message.pipelineStages} />
        ) : (
          <>
            {message.pipelineStages && (
              <div className="mb-2">
                <Pipeline stages={message.pipelineStages} />
              </div>
            )}
            <div className="prose-warp">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            {message.sources && message.sources.length > 0 && (
              <Sources sources={message.sources} />
            )}
          </>
        )}
      </div>
    </article>
  );
}

function LoadingBody({ stages }: { stages?: Stage[] }) {
  return (
    <div>
      <div className="flex items-center gap-2 font-mono text-[12px] text-ink-dim">
        <span className="text-prompt">▸</span>
        <span>tracing across your library</span>
        <span className="caret text-prompt" />
      </div>
      {stages && <Pipeline stages={stages} />}
    </div>
  );
}
