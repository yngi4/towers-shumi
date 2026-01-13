import { TILE_HEIGHT, TILE_WIDTH } from '../constants';

// Convert Grid Coordinates to Screen Pixels (CSS top/left)
// We center the grid somewhat
export const toIso = (x: number, y: number, offsetX: number = 0, offsetY: number = 0) => {
  const screenX = (x - y) * (TILE_WIDTH / 2) + offsetX;
  const screenY = (x + y) * (TILE_HEIGHT / 2) + offsetY;
  return { x: screenX, y: screenY };
};

// Calculate visual Z-index (render order)
// Items "lower" on the screen (higher Y) should be on top
export const getZIndex = (x: number, y: number, floorOffset: number = 0) => {
  return Math.floor((x + y) * 10) + floorOffset;
};

// Simple distance
export const distance = (x1: number, y1: number, x2: number, y2: number) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

export const lerp = (start: number, end: number, t: number) => {
  return start * (1 - t) + end * t;
};
