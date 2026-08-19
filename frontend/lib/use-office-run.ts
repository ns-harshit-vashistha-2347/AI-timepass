"use client";

import { useCallback, useRef, useState } from "react";
import { computeLayers, type GraphTopology } from "./graph-layout";
import type { DeskStatus } from "./office-data";

export interface OfficeRunState {
  runningDepartmentId: string | null;
  statuses: Record<string, DeskStatus>;
  statusLine: string;
}

const STEP_MS = 650;

/**
 * Steps a department's nodes from idle -> active -> done, one layer at a
 * time, matching real execution order. This is a client-side stand-in:
 * swap the setInterval loop for a WebSocket listener on backend node
 * events (see src/graphs/*.stream()) and every consumer of this hook
 * keeps working unchanged, since the shape it returns is the same either
 * way — a status map keyed by node id.
 */
export function useOfficeRun() {
  const [state, setState] = useState<OfficeRunState>({
    runningDepartmentId: null,
    statuses: {},
    statusLine: "Waiting at the front desk.",
  });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const run = useCallback(
    (departmentId: string, departmentLabel: string, topology: GraphTopology) => {
      if (timerRef.current) clearInterval(timerRef.current);

      const layers = computeLayers(topology);
      const initial: Record<string, DeskStatus> = {};
      topology.nodes.forEach((n) => (initial[n.id] = "idle"));

      setState({
        runningDepartmentId: departmentId,
        statuses: initial,
        statusLine: `Routing your question to ${departmentLabel}...`,
      });

      let layerIndex = 0;

      timerRef.current = setInterval(() => {
        setState((prev) => {
          const next = { ...prev.statuses };

          if (layerIndex > 0) {
            layers[layerIndex - 1].forEach((n) => {
              next[n.id] = "done";
            });
          }

          if (layerIndex >= layers.length) {
            if (timerRef.current) clearInterval(timerRef.current);
            return {
              runningDepartmentId: null,
              statuses: next,
              statusLine: `Answer delivered by ${departmentLabel}.`,
            };
          }

          const layer = layers[layerIndex];
          layer.forEach((n) => {
            next[n.id] = "active";
          });

          const names = layer.map((n) => n.label).join(" and ");
          layerIndex++;

          return {
            runningDepartmentId: departmentId,
            statuses: next,
            statusLine:
              layer.length > 1
                ? `Running ${names} in parallel...`
                : `Running ${names}...`,
          };
        });
      }, STEP_MS);
    },
    []
  );

  return { state, run };
}
