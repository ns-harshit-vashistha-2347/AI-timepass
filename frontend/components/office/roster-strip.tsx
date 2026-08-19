import { DEPARTMENTS, type DeskStatus } from "@/lib/office-data";
import { cn } from "@/lib/cn";

export function RosterStrip({
  statuses,
  activeDepartmentId,
}: {
  statuses: Record<string, DeskStatus>;
  activeDepartmentId: string | null;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {DEPARTMENTS.flatMap((d) =>
        d.topology.nodes.map((n) => {
          const status: DeskStatus =
            d.id === activeDepartmentId
              ? statuses[n.id] ?? "idle"
              : "idle";

          return (
            <div
              key={`${d.id}:${n.id}`}
              className={cn(
                "group flex shrink-0 items-center gap-2",
                "rounded-lg border px-3 py-2",
                "bg-surface/40",
                "transition-all duration-200",
                "border-surface-border",
                status === "active" &&
                  "border-circuit/50 bg-circuit/[0.06]",
                status === "done" &&
                  "border-success/40 bg-success/[0.04]"
              )}
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  status === "active" &&
                    "animate-pulse bg-circuit",
                  status === "done" &&
                    "bg-success",
                  status === "idle" &&
                    "bg-text-subtle/40"
                )}
              />

              <div className="min-w-0">
                <p className="truncate font-mono text-[10px] uppercase tracking-wide text-text-subtle">
                  {d.label}
                </p>

                <p className="truncate font-mono text-[11px] text-text-muted">
                  {n.label}
                </p>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}