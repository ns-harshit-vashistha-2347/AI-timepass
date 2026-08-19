"use client";

import { useEffect, useRef } from "react";
import { isoProject, TILE_W, TILE_H } from "@/lib/iso";
import { buildOfficeLayout } from "@/lib/office-iso-layout";
import type { DeskStatus } from "@/lib/office-data";

const PAD = 40;
// Flat top-down sprites are shorter than the old side-view iso
// characters, so headroom above each tile can shrink from 60 -> 24.
const HEADROOM = 24;

function computeBounds(layout: ReturnType<typeof buildOfficeLayout>) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  layout.zones.forEach((zone) => {
    for (let c = zone.colStart; c <= zone.colEnd; c++) {
      for (let r = zone.rowStart; r <= zone.rowEnd; r++) {
        const { x, y } = isoProject(c, r);

        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x + TILE_W);

        minY = Math.min(minY, y);

        maxY = Math.max(
          maxY,
          y + TILE_H
        );
      }
    }
  });

  return {
    width: maxX - minX + PAD * 2,
    height: maxY - minY + PAD * 2,
    offsetX: -minX + PAD,
    offsetY: -minY + PAD,
  };
}

export function PhaserOffice({
  statuses,
}: {
  statuses: Record<string, DeskStatus>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<import("phaser").Game | null>(null);
  const sceneRef = useRef<import("./OfficeScene").OfficeScene | null>(null);
  const statusesRef = useRef(statuses);
  statusesRef.current = statuses;

  useEffect(() => {
    let destroyed = false;

    (async () => {
      const Phaser = (await import("phaser")).default;
      const { OfficeScene } = await import("./OfficeScene");

      if (destroyed || !containerRef.current) return;

      const layout = buildOfficeLayout();
      const bounds = computeBounds(layout);

      const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: containerRef.current,
        width: bounds.width,
        height: bounds.height,
        transparent: true,
        scene: OfficeScene,
        render: { antialias: true },
      });

      game.scene.start("OfficeScene", {
        layout,
        offsetX: bounds.offsetX,
        offsetY: bounds.offsetY,
      });

      gameRef.current = game;

      game.events.once("ready", () => {
        const scene = game.scene.getScene("OfficeScene") as InstanceType<typeof OfficeScene>;
        sceneRef.current = scene;
        scene.setStatuses(statusesRef.current);
      });
    })();

    return () => {
      destroyed = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    sceneRef.current?.setStatuses(statuses);
  }, [statuses]);

  return <div ref={containerRef} className="flex justify-center" />;
}