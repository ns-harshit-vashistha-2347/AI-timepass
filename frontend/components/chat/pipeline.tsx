import { cn } from "@/lib/cn";
import type { Stage } from "@/lib/use-pipeline";

export function Pipeline({ stages }: { stages: Stage[] }) {
  return (
    <div className="mt-2 rounded-md border border-chrome-border bg-bg/50 p-3">
      <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
        <span className="text-ink-dim">
          <span className="text-prompt">◆</span> agent pipeline
        </span>
        <StageSummary stages={stages} />
      </div>

      <ol className="space-y-1.5">
        {stages.map((s) => (
          <StageRow key={s.id} stage={s} />
        ))}
      </ol>
    </div>
  );
}

function StageSummary({ stages }: { stages: Stage[] }) {
  const active = stages.find((s) => s.status === "on");
  if (active) return <span className="text-prompt">{active.label} · running</span>;
  if (stages.every((s) => s.status === "done"))
    return <span className="text-ok">complete</span>;
  return <span className="text-ink-faint">idle</span>;
}

function StageRow({ stage }: { stage: Stage }) {
  const isDone = stage.status === "done";
  const isOn = stage.status === "on";

  return (
    <li className="grid grid-cols-[16px_72px_1fr_46px] items-center gap-3 font-mono text-[11px]">
      <span
        className={cn(
          "flex h-4 w-4 items-center justify-center rounded-sm text-[11px]",
          isDone && "text-ok",
          isOn && "text-prompt",
          !isDone && !isOn && "text-ink-faint"
        )}
        aria-hidden
      >
        {isDone ? "✓" : isOn ? "▶" : "·"}
      </span>

      <span
        className={cn(
          "tracking-[0.06em]",
          isDone && "text-ink",
          isOn && "text-prompt",
          !isDone && !isOn && "text-ink-faint"
        )}
      >
        {stage.label}
      </span>

      <div className="relative h-[3px] overflow-hidden rounded-sm bg-chrome-border/60">
        {isDone && <div className="absolute inset-0 bg-ok" />}
        {isOn && (
          <div className="absolute inset-0 -translate-x-full animate-bar-shimmer bg-gradient-to-r from-transparent via-prompt to-transparent" />
        )}
      </div>

      <span
        className={cn(
          "text-right text-[10px] tracking-[0.1em]",
          isDone && "text-ink-muted",
          isOn && "text-prompt",
          !isDone && !isOn && "text-ink-faint"
        )}
      >
        {isDone && stage.ms != null ? `${stage.ms}ms` : isOn ? "…" : "wait"}
      </span>
    </li>
  );
}
