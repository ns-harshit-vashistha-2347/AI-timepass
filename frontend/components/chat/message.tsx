"use client";

import ReactMarkdown from "react-markdown";
import { Sparkles, User } from "lucide-react";
import { Sources } from "./sources";
import type { SourceChunk } from "@/lib/rag";
import { cn } from "@/lib/cn";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceChunk[];
  loading?: boolean;
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex gap-3 animate-fade-in", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-surface border border-surface-border"
            : "bg-gradient-to-br from-accent to-accent-soft glow"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4 text-text-muted" />
        ) : (
          <Sparkles className="h-4 w-4 text-white" />
        )}
      </div>

      <div className={cn("min-w-0 flex-1", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "max-w-full rounded-2xl px-4 py-3 text-sm",
            isUser
              ? "bg-accent text-white rounded-tr-sm"
              : "bg-surface border border-surface-border text-text rounded-tl-sm"
          )}
        >
          {message.loading ? (
            <TypingDots />
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-chat">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full">
            <Sources sources={message.sources} />
          </div>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: "0ms" }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: "150ms" }} />
      <span className="h-2 w-2 animate-bounce rounded-full bg-text-muted" style={{ animationDelay: "300ms" }} />
    </div>
  );
}
