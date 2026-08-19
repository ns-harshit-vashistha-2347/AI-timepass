"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import { AppShell } from "@/components/app-shell";
import { AuthProvider } from "@/components/auth/auth-provider";
import { FrontDesk } from "@/components/office/front-desk";
import { PhaserOffice } from "@/components/office/phaser-office";
import { RosterStrip } from "@/components/office/roster-strip";
import { DEPARTMENTS, type DeskStatus } from "@/lib/office-data";
import { useOfficeRun } from "@/lib/use-office-run";
import { OfficeDetailPanel } from "@/components/office/office-detail-panel";

function OfficeInner() {
  const { state, run } = useOfficeRun();

  const [selectedDepartmentId, setSelectedDepartmentId] =
    useState(DEPARTMENTS[0].id);

  const [answer, setAnswer] =
    useState<string | null>(null);

  function handleRun(departmentId: string) {
    setAnswer(null);

    const department =
      DEPARTMENTS.find(
        (d) => d.id === departmentId
      );

    if (!department) {
      return;
    }

    setSelectedDepartmentId(
      department.id
    );

    run(
      department.id,
      department.label,
      department.topology
    );
  }

  const sceneStatuses = useMemo(() => {
    const map: Record<string, DeskStatus> = {
      "mickel:mickel":
        state.runningDepartmentId
          ? "active"
          : "idle",
    };

    DEPARTMENTS.forEach((d) => {
      d.topology.nodes.forEach((n) => {
        map[`${d.id}:${n.id}`] =
          d.id === state.runningDepartmentId
            ? state.statuses[n.id] ?? "idle"
            : "idle";
      });
    });

    return map;
  }, [state]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 animate-pulse rounded-full bg-circuit" />

            <h1 className="text-2xl font-semibold tracking-tight text-text">
              The office
            </h1>
          </div>

          <p className="mt-1 pl-5 text-sm text-text-muted">
            Every question passes through the front desk before it reaches a
            department.
          </p>
        </div>

        {/* Front desk controls */}
        <div className="mb-5">
          <FrontDesk
            statusLine={state.statusLine}
            running={
              state.runningDepartmentId !== null
            }
            selectedDepartmentId={
              selectedDepartmentId
            }
            onSelectDepartment={
              setSelectedDepartmentId
            }
            onRun={handleRun}
            onAnswer={setAnswer}
          />
        </div>

        {/* Main futuristic office layout */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">

          {/* Office */}
          <div className="min-w-0 overflow-x-auto rounded-xl border border-surface-border bg-surface/30 p-3">
            <div className="mb-3 flex items-center justify-between border-b border-surface-border pb-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-subtle">
                  live environment
                </p>

                <p className="mt-1 text-xs text-text-muted">
                  Agent activity map
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-circuit" />

                <span className="font-mono text-[9px] uppercase tracking-wide text-text-subtle">
                  live
                </span>
              </div>
            </div>

            <PhaserOffice
              statuses={sceneStatuses}
            />
          </div>

          {/* Detail panel */}
          <OfficeDetailPanel
            selectedDepartmentId={
              selectedDepartmentId
            }
            statuses={state.statuses}
            statusLine={state.statusLine}
            answer={answer}
          />
        </div>

        {/* Bottom roster */}
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[11px] uppercase tracking-[0.15em] text-text-subtle">
              agent roster
            </p>

            <span className="font-mono text-[9px] text-text-subtle">
              {DEPARTMENTS.reduce(
                (count, d) =>
                  count +
                  d.topology.nodes.length,
                0
              )}{" "}
              agents
            </span>
          </div>

          <RosterStrip
            statuses={state.statuses}
            activeDepartmentId={
              state.runningDepartmentId
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function OfficePage() {
  return (
    <AuthProvider>
      <AppShell>
        <OfficeInner />
      </AppShell>
    </AuthProvider>
  );
}
