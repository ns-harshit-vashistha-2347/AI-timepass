"use client";

import { cn } from "@/lib/cn";
import { DEPARTMENTS, type DeskStatus } from "@/lib/office-data";

export function OfficeDetailPanel({
  selectedDepartmentId,
  statuses,
  statusLine,
  answer,
}: {
  selectedDepartmentId: string;
  statuses: Record<string, DeskStatus>;
  statusLine: string;
  answer: string | null;
}) {
  const department =
    DEPARTMENTS.find(
      (d) => d.id === selectedDepartmentId
    ) ?? DEPARTMENTS[0];

  const activeNodes =
    department.topology.nodes.filter(
      (node) =>
        statuses[node.id] === "active"
    );

  const completedNodes =
    department.topology.nodes.filter(
      (node) =>
        statuses[node.id] === "done"
    );

  return (
    <aside className="flex h-full min-h-[520px] flex-col overflow-hidden rounded-xl border border-surface-border bg-surface/50">
      {/* Header */}
      <div className="border-b border-surface-border p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-subtle">
            department
          </span>

          <span className="h-2 w-2 animate-pulse rounded-full bg-circuit" />
        </div>

        <h2 className="text-lg font-semibold text-text">
          {department.label}
        </h2>

        <p className="mt-1 text-xs text-text-muted">
          {statusLine}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-border">
        <button
          type="button"
          className="flex-1 border-b-2 border-circuit px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-circuit"
        >
          overview
        </button>

        <button
          type="button"
          className="flex-1 px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-text-subtle"
        >
          activity
        </button>
      </div>

      {/* Department */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-5">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-subtle">
            agents
          </p>

          <div className="space-y-2">
            {department.topology.nodes.map(
              (node) => {
                const status =
                  statuses[node.id] ?? "idle";

                return (
                  <div
                    key={node.id}
                    className={cn(
                      "flex items-center justify-between rounded-lg border px-3 py-2",
                      "border-surface-border bg-surface/30",
                      status === "active" &&
                        "border-circuit/40 bg-circuit/[0.05]",
                      status === "done" &&
                        "border-success/30 bg-success/[0.04]"
                    )}
                  >
                    <span className="font-mono text-xs text-text-muted">
                      {node.label}
                    </span>

                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[9px] uppercase",
                        status === "active" &&
                          "bg-circuit/10 text-circuit",
                        status === "done" &&
                          "bg-success/10 text-success",
                        status === "idle" &&
                          "bg-text-subtle/10 text-text-subtle"
                      )}
                    >
                      {status}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Activity */}
        <div className="mb-5">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-subtle">
            activity
          </p>

          <div className="rounded-lg border border-surface-border bg-black/10 p-3">
            <div className="space-y-2 font-mono text-[10px] text-text-muted">
              <div className="flex gap-2">
                <span className="text-circuit">
                  →
                </span>

                <span>
                  {activeNodes.length > 0
                    ? `${activeNodes.length} agent(s) processing`
                    : "Waiting for work"}
                </span>
              </div>

              <div className="flex gap-2">
                <span className="text-success">
                  ✓
                </span>

                <span>
                  {completedNodes.length} completed
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Answer */}
        {answer && (
          <div>
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.15em] text-text-subtle">
              latest output
            </p>

            <div className="max-h-48 overflow-y-auto rounded-lg border border-success/20 bg-success/[0.03] p-3 text-xs leading-relaxed text-text-muted">
              {answer}
            </div>
          </div>
        )}
      </div>

      {/* Bottom status */}
      <div className="border-t border-surface-border p-3">
        <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface/30 px-3 py-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-circuit" />

          <span className="font-mono text-[10px] text-text-subtle">
            system online
          </span>
        </div>
      </div>
    </aside>
  );
}