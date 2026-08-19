"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type StageId = "desk" | "parse" | "embed" | "rank" | "reply";
export type StageStatus = "wait" | "on" | "done";

export interface Stage {
  id: StageId;
  label: string;
  status: StageStatus;
  ms: number | null;
}

const ORDER: { id: StageId; label: string; approxMs: number }[] = [
  { id: "desk", label: "desk", approxMs: 60 },
  { id: "parse", label: "parse", approxMs: 140 },
  { id: "embed", label: "embed", approxMs: 340 },
  { id: "rank", label: "rank", approxMs: 220 },
  { id: "reply", label: "reply", approxMs: 260 },
];

function initial(): Stage[] {
  return ORDER.map((s) => ({ id: s.id, label: s.label, status: "wait", ms: null }));
}

/**
 * Client-side pipeline animator. Walks desk → reply while the request is
 * in-flight; when finish() is called, marks any remaining stages done.
 * Swap for a WebSocket stream from the backend when it starts emitting
 * stage events — the returned shape is unchanged.
 */
export function usePipeline() {
  const [stages, setStages] = useState<Stage[]>(() => initial());
  const [running, setRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const startedAt = useRef<number>(0);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const start = useCallback(() => {
    clearTimers();
    setStages(initial());
    setRunning(true);
    startedAt.current = performance.now();

    // schedule stage advances; last stage stays "on" until finish() is called
    let acc = 0;
    ORDER.forEach((s, i) => {
      const flipOn = setTimeout(() => {
        setStages((prev) =>
          prev.map((p, j) =>
            j < i
              ? { ...p, status: "done", ms: p.ms ?? Math.round(ORDER[j].approxMs) }
              : j === i
              ? { ...p, status: "on" }
              : p
          )
        );
      }, acc);
      timers.current.push(flipOn);
      acc += s.approxMs;
    });
  }, []);

  const finish = useCallback((): Stage[] => {
    clearTimers();
    let finalStages: Stage[] = [];
    setStages((prev) => {
      let running = 0;
      finalStages = prev.map((p, i) => {
        if (p.status === "done") {
          running += p.ms ?? 0;
          return p;
        }
        const elapsed =
          i === prev.length - 1
            ? Math.max(20, Math.round(performance.now() - startedAt.current - running))
            : ORDER[i].approxMs;
        running += elapsed;
        return { ...p, status: "done", ms: elapsed };
      });
      return finalStages;
    });
    setRunning(false);
    return finalStages;
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setStages(initial());
    setRunning(false);
  }, []);

  useEffect(() => clearTimers, []);

  return { stages, running, start, finish, reset };
}
