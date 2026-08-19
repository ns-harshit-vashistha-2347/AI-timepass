// Flat top-down grid projection.
// Kept as isoProject so existing OfficeScene/phaser-office imports
// do not need to change.
export const TILE_W = 40;
export const TILE_H = 40;

export function isoProject(col: number, row: number): { x: number; y: number } {
  return {
    x: col * TILE_W,
    y: row * TILE_H,
  };
}