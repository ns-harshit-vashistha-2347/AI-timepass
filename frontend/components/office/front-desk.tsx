"use client";

import { useState } from "react";
import { Send, User2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import { DEPARTMENTS } from "@/lib/office-data";
import { queryApi } from "@/lib/rag";
import { ApiError } from "@/lib/api";

export function FrontDesk({
  statusLine,
  running,
  selectedDepartmentId,
  onSelectDepartment,
  onRun,
  onAnswer,
}: {
  statusLine: string;
  running: boolean;
  selectedDepartmentId: string;
  onSelectDepartment: (id: string) => void;
  onRun: (departmentId: string) => void;
  onAnswer: (answer: string) => void;
}) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    const text = input.trim();
    if (!text || sending || running) return;

    const department = DEPARTMENTS.find((d) => d.id === selectedDepartmentId);
    if (!department) return;

    setSending(true);
    onRun(department.id);

    try {
      const res = await queryApi.ask(text);
      onAnswer(res.answer);
    } catch (err) {
      const detail = err instanceof ApiError ? err.detail : "Something went wrong";
      toast.error(detail);
    } finally {
      setSending(false);
      setInput("");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-accent/25 bg-gradient-to-r from-surface via-surface to-accent/[0.05] p-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,181,68,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(245,181,68,0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative flex items-start gap-3">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-bg">
          <User2 className="h-5 w-5 text-accent-glow" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg",
              running ? "animate-pulse bg-circuit" : "bg-success"
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-text">Mickel</p>
              <p className="font-mono text-[11px] text-accent-glow">
                head manager · front desk
              </p>
            </div>

            <div className="flex gap-1 rounded-lg border border-surface-border bg-bg/60 p-0.5">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => onSelectDepartment(d.id)}
                  disabled={running}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors",
                    selectedDepartmentId === d.id
                      ? "bg-accent/15 text-accent-glow"
                      : "text-text-subtle hover:text-text"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-3 min-h-[16px] font-mono text-xs text-text-muted">
            {statusLine}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="relative"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question and Mickel will route it..."
              disabled={sending || running}
              className="w-full rounded-lg border border-surface-border bg-bg px-3.5 py-2.5 pr-11 text-sm text-text placeholder:text-text-subtle focus:border-accent/60 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending || running}
              aria-label="Send"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-accent/15 text-accent-glow transition-colors hover:bg-accent/25 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
