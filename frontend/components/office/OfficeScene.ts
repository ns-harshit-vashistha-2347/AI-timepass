import Phaser from "phaser";
import { isoProject, TILE_W, TILE_H } from "@/lib/iso";
import type { IsoOfficeLayout, IsoZone } from "@/lib/office-iso-layout";
import type { DeskStatus } from "@/lib/office-data";

const COLOR_FLOOR_LIGHT = 0x202a3a;
const COLOR_FLOOR_DARK = 0x182130;

const COLOR_WALL = 0x526176;
const COLOR_WALL_ACTIVE = 0x22d3ee;

const COLOR_DESK_TOP = 0x344256;
const COLOR_DESK_BORDER = 0x5a6b82;

const COLOR_CHAIR = 0x253246;
const COLOR_CHAIR_BACK = 0x172233;

const COLOR_MONITOR_BEZEL = 0x101722;
const COLOR_MONITOR_OFF = 0x0b111b;
const COLOR_MONITOR_ON = 0x22d3ee;
const COLOR_MONITOR_DONE = 0x4ade80;

const COLOR_PLANT = 0x4ade80;
const COLOR_POT = 0x76543d;

const COLOR_SKIN_A = 0xf5c9a6;
const COLOR_SKIN_B = 0xd9a67f;
const COLOR_SKIN_C = 0xa87850;

const COLOR_HAIR_A = 0x2a1f18;
const COLOR_HAIR_B = 0x6b4020;
const COLOR_HAIR_C = 0xd4a058;

const COLOR_SHIRT_A = 0x3b82f6;
const COLOR_SHIRT_B = 0xef4444;
const COLOR_SHIRT_C = 0x8b5cf6;
const COLOR_SHIRT_D = 0xf5b544;
const COLOR_SHIRT_E = 0x14b8a6;

const COLOR_HALO_ACTIVE = 0x22d3ee;
const COLOR_HALO_DONE = 0x4ade80;

const SHIRTS = [
  COLOR_SHIRT_A,
  COLOR_SHIRT_B,
  COLOR_SHIRT_C,
  COLOR_SHIRT_D,
  COLOR_SHIRT_E,
];

const HAIRS = [COLOR_HAIR_A, COLOR_HAIR_B, COLOR_HAIR_C];
const SKINS = [COLOR_SKIN_A, COLOR_SKIN_B, COLOR_SKIN_C];

interface DeskVisual {
  characterGroup: Phaser.GameObjects.Container | null;
  monitorScreen: Phaser.GameObjects.Rectangle | null;
  halo: Phaser.GameObjects.Arc | null;
  check: Phaser.GameObjects.Graphics | null;
  status: DeskStatus;
  baseY: number;
  activeTween: Phaser.Tweens.Tween | null;
}

function hashSeed(s: string): number {
  let h = 0;

  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }

  return Math.abs(h);
}

export class OfficeScene extends Phaser.Scene {
  private layout!: IsoOfficeLayout;
  private offsetX = 0;
  private offsetY = 0;

  private desks = new Map<string, DeskVisual>();
  private zoneWalls = new Map<string, Phaser.GameObjects.Graphics>();

  private lastStatuses: Record<string, DeskStatus> = {};

  constructor() {
    super({ key: "OfficeScene" });
  }

  init(data: {
    layout: IsoOfficeLayout;
    offsetX: number;
    offsetY: number;
  }) {
    this.layout = data.layout;
    this.offsetX = data.offsetX;
    this.offsetY = data.offsetY;
  }

  preload() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    this.makeFloorTexture(g, "floor-light", COLOR_FLOOR_LIGHT);
    this.makeFloorTexture(g, "floor-dark", COLOR_FLOOR_DARK);

    g.destroy();
  }

  /**
   * Flat square floor tile.
   *
   * Previously this created a diamond to simulate the isometric floor.
   * The reference design uses a straight top-down grid.
   */
  private makeFloorTexture(
    g: Phaser.GameObjects.Graphics,
    key: string,
    fill: number
  ) {
    g.clear();

    g.fillStyle(fill, 1);
    g.fillRect(0, 0, TILE_W, TILE_H);

    g.lineStyle(1, 0x000000, 0.18);
    g.strokeRect(0, 0, TILE_W, TILE_H);

    g.generateTexture(key, TILE_W, TILE_H);
  }

  create() {
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    this.drawFloors();

    this.layout.zones.forEach((zone) => this.drawZoneWalls(zone));
    this.layout.zones.forEach((zone) => this.drawZoneLabel(zone));
    this.layout.zones.forEach((zone) => this.decorateZone(zone));

    this.layout.zones.forEach((zone) => {
      zone.desks.forEach((desk) => {
        this.createDesk(zone, desk);
      });
    });
  }

  private toScreen(col: number, row: number) {
    const p = isoProject(col, row);

    return {
      x: p.x + this.offsetX,
      y: p.y + this.offsetY,
    };
  }

  private drawFloors() {
    this.layout.zones.forEach((zone) => {
      for (let c = zone.colStart; c < zone.colEnd; c++) {
        for (let r = zone.rowStart; r < zone.rowEnd; r++) {
          const { x, y } = this.toScreen(c, r);

          const key =
            (c + r) % 2 === 0 ? "floor-light" : "floor-dark";

          const tile = this.add.image(
            x + TILE_W / 2,
            y + TILE_H / 2,
            key
          );

          tile.setDepth(-2000);
        }
      }
    });
  }

  /**
   * Draw thick rectangular walls around each room.
   * This replaces the thin isometric outline.
   */
  private drawZoneWalls(zone: IsoZone) {
    const g = this.add.graphics();

    this.strokeZone(g, zone, COLOR_WALL, 3, 0.95);

    g.setDepth(-1500);

    this.zoneWalls.set(zone.id, g);
  }

  private strokeZone(
    g: Phaser.GameObjects.Graphics,
    zone: IsoZone,
    color: number,
    width: number,
    alpha: number
  ) {
    const start = this.toScreen(
      zone.colStart,
      zone.rowStart
    );

    const end = this.toScreen(
      zone.colEnd,
      zone.rowEnd
    );

    const x = start.x;
    const y = start.y;

    const roomWidth = end.x - start.x;
    const roomHeight = end.y - start.y;

    g.lineStyle(width, color, alpha);

    /*
     * Outer wall
     */
    g.strokeRect(
      x,
      y,
      roomWidth,
      roomHeight
    );

    /*
     * Inner accent line.
     * Gives the room the clean futuristic double-wall look.
     */
    g.lineStyle(
      1,
      color,
      Math.min(alpha, 0.45)
    );

    g.strokeRect(
      x + 5,
      y + 5,
      roomWidth - 10,
      roomHeight - 10
    );
  }

  private drawZoneLabel(zone: IsoZone) {
    const top = this.toScreen(
      (zone.colStart + zone.colEnd) / 2,
      zone.rowStart
    );

    const text = this.add.text(
      top.x,
      top.y - 8,
      zone.label,
      {
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, monospace",

        fontSize: "11px",

        color:
          zone.kind === "mickel"
            ? "#ffd280"
            : "#a3adc2",

        fontStyle: "bold",

        backgroundColor: "#101722",

        padding: {
          left: 6,
          right: 6,
          top: 3,
          bottom: 3,
        },
      }
    );

    text.setOrigin(0.5, 1);
    text.setDepth(9999);
  }

  private decorateZone(zone: IsoZone) {
    if (zone.kind === "mickel") {
      return;
    }

    const cornersInside: Array<[number, number]> = [
      [zone.colStart, zone.rowStart],
      [zone.colEnd - 1, zone.rowStart],
      [zone.colStart, zone.rowEnd - 1],
      [zone.colEnd - 1, zone.rowEnd - 1],
    ];

    const seed = hashSeed(zone.id);
    const placed = new Set<string>();

    [
      cornersInside[seed % 4],
      cornersInside[(seed + 2) % 4],
    ].forEach(([c, r]) => {
      const cellKey = `${c},${r}`;

      if (placed.has(cellKey)) {
        return;
      }

      const hasDesk = zone.desks.some(
        (d) => d.col === c && d.row === r
      );

      if (hasDesk) {
        return;
      }

      const { x, y } = this.toScreen(c, r);

      this.drawPlant(
        x + TILE_W / 2,
        y + TILE_H / 2
      );

      placed.add(cellKey);
    });
  }

  private drawPlant(cx: number, groundY: number) {
    const g = this.add.graphics();

    g.fillStyle(COLOR_POT, 1);
    g.fillRoundedRect(
      cx - 5,
      groundY - 1,
      10,
      8,
      2
    );

    g.fillStyle(COLOR_PLANT, 1);

    g.fillCircle(
      cx,
      groundY - 8,
      7
    );

    g.fillCircle(
      cx - 4,
      groundY - 5,
      5
    );

    g.fillCircle(
      cx + 4,
      groundY - 5,
      5
    );

    g.setDepth(groundY);
  }

  private createDesk(
    zone: IsoZone,
    desk: {
      id: string;
      label: string;
      col: number;
      row: number;
    }
  ) {
    const { x, y } = this.toScreen(
      desk.col,
      desk.row
    );

    const cx = x + TILE_W / 2;
    const groundY = y + TILE_H / 2;

    const key = `${zone.id}:${desk.id}`;

    if (zone.kind === "mickel") {
      this.drawFrontDesk(cx, groundY);

      this.createCharacter(
        key,
        cx,
        groundY - 2,
        {
          hair: COLOR_HAIR_A,
          shirt: COLOR_SHIRT_D,
        }
      );

      this.addLabel(
        cx,
        groundY + 22,
        desk.label,
        "#ffd280"
      );

      return;
    }

    this.drawIsoDesk(cx, groundY);

    const monitorScreen =
      this.drawMonitorAndChair(
        cx,
        groundY
      );

    this.createCharacter(
      key,
      cx,
      groundY + 7,
      undefined,
      monitorScreen
    );

    this.addLabel(
      cx,
      groundY + 23,
      desk.label,
      "#a3adc2"
    );
  }

  /**
   * Flat front desk.
   */
  private drawFrontDesk(
    cx: number,
    groundY: number
  ) {
    const g = this.add.graphics();

    g.fillStyle(
      COLOR_DESK_TOP,
      1
    );

    g.fillRoundedRect(
      cx - 24,
      groundY - 12,
      48,
      14,
      2
    );

    g.lineStyle(
      1,
      COLOR_DESK_BORDER,
      1
    );

    g.strokeRoundedRect(
      cx - 24,
      groundY - 12,
      48,
      14,
      2
    );

    g.setDepth(groundY);
  }

  /**
   * Flat top-down desk.
   *
   * Previously this was a skewed parallelogram to create depth.
   */
  private drawIsoDesk(
    cx: number,
    groundY: number
  ) {
    const g = this.add.graphics();

    g.fillStyle(
      COLOR_DESK_TOP,
      1
    );

    g.fillRoundedRect(
      cx - 17,
      groundY - 5,
      34,
      12,
      2
    );

    g.lineStyle(
      1,
      COLOR_DESK_BORDER,
      1
    );

    g.strokeRoundedRect(
      cx - 17,
      groundY - 5,
      34,
      12,
      2
    );

    g.setDepth(groundY);
  }

  /**
   * Monitor centered above the desk.
   * Chair centered below the desk.
   */
  private drawMonitorAndChair(
    cx: number,
    groundY: number
  ): Phaser.GameObjects.Rectangle {
    const chair = this.add.graphics();

    chair.fillStyle(
      COLOR_CHAIR,
      1
    );

    chair.fillRoundedRect(
      cx - 7,
      groundY + 7,
      14,
      8,
      3
    );

    chair.fillStyle(
      COLOR_CHAIR_BACK,
      1
    );

    chair.fillRoundedRect(
      cx - 6,
      groundY + 12,
      12,
      7,
      3
    );

    chair.setDepth(
      groundY + 1
    );

    /*
     * Monitor bezel
     */
    const bezel = this.add.rectangle(
      cx,
      groundY - 14,
      18,
      12,
      COLOR_MONITOR_BEZEL
    );

    bezel.setDepth(
      groundY + 2
    );

    /*
     * Monitor stand
     */
    const stand = this.add.rectangle(
      cx,
      groundY - 6,
      3,
      5,
      COLOR_MONITOR_BEZEL
    );

    stand.setDepth(
      groundY + 2
    );

    /*
     * Screen
     */
    const screen = this.add.rectangle(
      cx,
      groundY - 14,
      14,
      8,
      COLOR_MONITOR_OFF
    );

    screen.setDepth(
      groundY + 3
    );

    return screen;
  }

  /**
   * Simplified top-down character.
   *
   * The previous version rendered a full side-facing person.
   * The reference uses small top-down avatar-like characters.
   */
  private createCharacter(
    key: string,
    cx: number,
    groundY: number,
    opts?: {
      hair?: number;
      shirt?: number;
      skin?: number;
    },
    monitorScreen?: Phaser.GameObjects.Rectangle
  ) {
    const seed = hashSeed(key);

    const shirt =
      opts?.shirt ??
      SHIRTS[seed % SHIRTS.length];

    const hair =
      opts?.hair ??
      HAIRS[(seed >> 2) % HAIRS.length];

    const skin =
      opts?.skin ??
      SKINS[(seed >> 4) % SKINS.length];

    const container = this.add.container(
      cx,
      groundY
    );

    container.setDepth(
      groundY + 5
    );

    /*
     * Shoulder/body circle.
     */
    const body = this.add.graphics();

    body.fillStyle(
      shirt,
      1
    );

    body.fillCircle(
      0,
      4,
      8
    );

    container.add(body);

    /*
     * Head viewed from above.
     */
    const head = this.add.graphics();

    head.fillStyle(
      skin,
      1
    );

    head.fillCircle(
      0,
      -5,
      6
    );

    container.add(head);

    /*
     * Hair cap.
     */
    const hairG = this.add.graphics();

    hairG.fillStyle(
      hair,
      1
    );

    hairG.fillCircle(
      0,
      -7,
      6
    );

    /*
     * Small face opening so the character
     * still has some visual direction.
     */
    hairG.fillStyle(
      skin,
      1
    );

    hairG.fillCircle(
      0,
      -4,
      4
    );

    container.add(hairG);

    /*
     * Small top-down shadow.
     */
    const shadow = this.add.graphics();

    shadow.fillStyle(
      0x000000,
      0.35
    );

    shadow.fillEllipse(
      cx,
      groundY + 8,
      17,
      6
    );

    shadow.setDepth(
      groundY - 2
    );

    /*
     * Active halo.
     */
    const halo = this.add.circle(
      cx,
      groundY,
      15,
      COLOR_HALO_ACTIVE,
      0
    );

    halo.setStrokeStyle(
      1.5,
      COLOR_HALO_ACTIVE,
      0.75
    );

    halo.setDepth(
      groundY + 4
    );

    halo.setVisible(false);

    /*
     * Completion check.
     */
    const check = this.add.graphics();

    check.lineStyle(
      2,
      COLOR_HALO_DONE,
      1
    );

    check.beginPath();

    check.moveTo(
      cx - 5,
      groundY - 14
    );

    check.lineTo(
      cx - 1,
      groundY - 10
    );

    check.lineTo(
      cx + 6,
      groundY - 18
    );

    check.strokePath();

    check.setDepth(
      groundY + 6
    );

    check.setVisible(false);

    /*
     * Very subtle idle animation.
     */
    const idleTween = this.tweens.add({
      targets: container,
      y: "-=1",
      duration:
        1200 + (seed % 400),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.desks.set(key, {
      characterGroup: container,
      monitorScreen:
        monitorScreen ?? null,
      halo,
      check,
      status: "idle",
      baseY: groundY,
      activeTween: idleTween,
    });
  }

  private addLabel(
    cx: number,
    y: number,
    text: string,
    color: string
  ) {
    const t = this.add.text(
      cx,
      y,
      text,
      {
        fontFamily:
          "ui-monospace, SFMono-Regular, Menlo, monospace",

        fontSize: "9px",

        color,
      }
    );

    t.setOrigin(0.5, 0.5);
    t.setDepth(9998);
  }

  setStatuses(
    statuses: Record<string, DeskStatus>
  ) {
    Object.entries(statuses).forEach(
      ([key, status]) => {
        if (
          this.lastStatuses[key] === status
        ) {
          return;
        }

        const visual =
          this.desks.get(key);

        if (visual) {
          visual.status = status;

          if (visual.halo) {
            visual.halo.setVisible(
              status === "active"
            );
          }

          if (visual.check) {
            visual.check.setVisible(
              status === "done"
            );
          }

          if (visual.activeTween) {
            visual.activeTween.timeScale =
              status === "active"
                ? 2.4
                : 1;
          }

          if (visual.monitorScreen) {
            const color =
              status === "active"
                ? COLOR_MONITOR_ON
                : status === "done"
                  ? COLOR_MONITOR_DONE
                  : COLOR_MONITOR_OFF;

            visual.monitorScreen.setFillStyle(
              color,
              status === "idle"
                ? 1
                : 0.85
            );
          }
        }

        const zoneId =
          key.split(":")[0];

        const walls =
          this.zoneWalls.get(zoneId);

        if (walls) {
          walls.clear();

          const zone =
            this.layout.zones.find(
              (z) => z.id === zoneId
            );

          if (zone) {
            const anyActive =
              zone.desks.some(
                (d) =>
                  (
                    statuses[
                      `${zone.id}:${d.id}`
                    ] ?? "idle"
                  ) !== "idle"
              );

            if (anyActive) {
              this.strokeZone(
                walls,
                zone,
                COLOR_WALL_ACTIVE,
                3,
                0.95
              );
            } else {
              this.strokeZone(
                walls,
                zone,
                COLOR_WALL,
                3,
                0.95
              );
            }
          }
        }
      }
    );

    this.lastStatuses = statuses;
  }
}