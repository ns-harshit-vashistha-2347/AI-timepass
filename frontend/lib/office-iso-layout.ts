import { DEPARTMENTS, type Department } from "./office-data";

export interface IsoDeskCell {
  id: string;
  label: string;
  col: number;
  row: number;
}

export interface IsoZone {
  kind: "mickel" | "department";
  id: string;
  label: string;
  desks: IsoDeskCell[];
  colStart: number;
  colEnd: number;
  rowStart: number;
  rowEnd: number;
}

export interface IsoOfficeLayout {
  zones: IsoZone[];
  totalCols: number;
  totalRows: number;
}

const ROOM_PAD = 1;
// Widened from 1 -> 2 so a visible corridor strip separates rooms,
// matching the reference's hallway gaps between office rooms.
const ROOM_GAP = 2;
const MICKEL_ROOM_W = 4;
const MICKEL_ROOM_H = 4;
const DEPT_ROOM_W = 6;
const DEPT_ROOM_H = 5;

/**
 * Arranges rooms in a two-column grid (Mickel top-left, then department
 * rooms filling the rest), rather than chaining them left-to-right.
 * Each department room is a fixed-size floor with desks placed in a
 * grid inside it, so the scene reads as populated rooms instead of a
 * thin snake of tiles. Zone sizing stays uniform so a new department
 * slots into the next open cell without hand-tuning.
 */
export function buildOfficeLayout(departments: Department[] = DEPARTMENTS): IsoOfficeLayout {
  const zones: IsoZone[] = [];

  const roomsPerRow = 2;
  const cellW = Math.max(MICKEL_ROOM_W, DEPT_ROOM_W) + ROOM_GAP;
  const cellH = Math.max(MICKEL_ROOM_H, DEPT_ROOM_H) + ROOM_GAP;

  const placeRoom = (
    kind: IsoZone["kind"],
    id: string,
    label: string,
    index: number,
    roomW: number,
    roomH: number
  ) => {
    const gridCol = index % roomsPerRow;
    const gridRow = Math.floor(index / roomsPerRow);
    const colStart = gridCol * cellW;
    const rowStart = gridRow * cellH;
    return {
      kind,
      id,
      label,
      desks: [] as IsoDeskCell[],
      colStart,
      colEnd: colStart + roomW,
      rowStart,
      rowEnd: rowStart + roomH,
    };
  };

  const mickelZone = placeRoom("mickel", "mickel", "Front desk", 0, MICKEL_ROOM_W, MICKEL_ROOM_H);
  mickelZone.desks.push({
    id: "mickel",
    label: "Mickel",
    col: mickelZone.colStart + Math.floor(MICKEL_ROOM_W / 2),
    row: mickelZone.rowStart + Math.floor(MICKEL_ROOM_H / 2),
  });
  zones.push(mickelZone);

  departments.forEach((dept, i) => {
    const zone = placeRoom(
      "department",
      dept.id,
      dept.label,
      i + 1,
      DEPT_ROOM_W,
      DEPT_ROOM_H
    );

    const innerW = DEPT_ROOM_W - ROOM_PAD * 2;
    const innerH = DEPT_ROOM_H - ROOM_PAD * 2;
    const desksCount = dept.topology.nodes.length;

    const cols = Math.min(innerW, Math.max(2, Math.ceil(Math.sqrt(desksCount))));
    const rows = Math.ceil(desksCount / cols);

    const startCol = zone.colStart + ROOM_PAD + Math.floor((innerW - cols) / 2);
    const startRow = zone.rowStart + ROOM_PAD + Math.floor((innerH - rows) / 2);

    dept.topology.nodes.forEach((node, idx) => {
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      zone.desks.push({
        id: node.id,
        label: node.label,
        col: startCol + c,
        row: startRow + r,
      });
    });

    zones.push(zone);
  });

  const totalCols = zones.reduce((m, z) => Math.max(m, z.colEnd), 0);
  const totalRows = zones.reduce((m, z) => Math.max(m, z.rowEnd), 0);

  return { zones, totalCols, totalRows };
}