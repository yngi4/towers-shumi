import { EnemyType, TowerType, Vector2 } from './types';

// Visuals
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32; // Isometric 2:1 ratio
export const FPS = 30;
export const FRAME_TIME = 1000 / FPS;

// Grid
export const MAP_SIZE = 8; // 8x8 grid

// Prices
export const TOWER_COSTS: Record<TowerType, number> = {
  [TowerType.PULSE]: 40,
  [TowerType.ARC]: 70,
  [TowerType.FROST]: 60,
};

// Tower Stats (Level 1)
export const TOWER_STATS: Record<TowerType, { range: number; damage: number; cooldown: number }> = {
  [TowerType.PULSE]: { range: 2.5, damage: 20, cooldown: 800 },
  [TowerType.ARC]: { range: 2.0, damage: 10, cooldown: 1200 }, // Chains
  [TowerType.FROST]: { range: 2.0, damage: 5, cooldown: 1000 }, // Slows
};

// Enemy Stats
export const ENEMY_STATS: Record<EnemyType, { hp: number; speed: number; reward: number }> = {
  [EnemyType.RUNNER]: { hp: 40, speed: 2.5, reward: 5 },
  [EnemyType.TANK]: { hp: 120, speed: 1.2, reward: 10 },
  [EnemyType.SHIELD]: { hp: 70, speed: 1.8, reward: 8 },
};

// Hero
export const HERO_SPEED = 4.0;
export const ABILITY_COOLDOWN = 15000; // 15 seconds
export const EMP_RANGE = 3;
export const EMP_DURATION = 3000;
export const OVERCLOCK_DURATION = 5000;

// Waves config
export const TOTAL_WAVES = 10;

// Hardcoded Map (8x8)
// 0: Empty, 1: Path, 2: Build, 3: Core, 4: Spawn, 5: Decor
export const INITIAL_MAP_GRID = [
  [4, 1, 1, 2, 2, 0, 5, 0],
  [2, 2, 1, 1, 1, 2, 0, 0],
  [0, 5, 2, 2, 1, 2, 2, 0],
  [0, 0, 0, 2, 1, 1, 1, 1],
  [2, 2, 2, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 5, 2, 2],
  [3, 2, 0, 0, 0, 0, 0, 0],
];

// Extracted path from grid manually for performance
export const INITIAL_PATH: Vector2[] = [
  { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, // Start
  { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 4, y: 2 }, // Winding
  { x: 4, y: 3 }, { x: 5, y: 3 }, { x: 6, y: 3 }, { x: 7, y: 3 },
  { x: 7, y: 4 }, { x: 7, y: 5 }, { x: 6, y: 5 }, { x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }, { x: 2, y: 5 }, { x: 1, y: 5 }, { x: 0, y: 5 },
  { x: 0, y: 6 }, // Loop back
  { x: 0, y: 7 } // Core
];
