export enum EntityType {
  TOWER = 'TOWER',
  ENEMY = 'ENEMY',
  HERO = 'HERO',
  PROJECTILE = 'PROJECTILE',
  CORE = 'CORE',
  DECOR = 'DECOR'
}

export enum TowerType {
  PULSE = 'PULSE',
  ARC = 'ARC',
  FROST = 'FROST'
}

export enum EnemyType {
  RUNNER = 'RUNNER',
  TANK = 'TANK',
  SHIELD = 'SHIELD'
}

export enum TileType {
  EMPTY = 0,
  PATH = 1,
  BUILD = 2,
  CORE = 3,
  SPAWN = 4,
  DECOR = 5
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  pos: Vector2; // Grid coordinates (float allowed for movement)
  z: number; // Visual depth (usually x + y)
}

export interface Enemy extends Entity {
  enemyType: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  frozen: number; // Duration of freeze in ms
  shielded: boolean;
  pathIndex: number; // Index in the path array
  distanceTraveled: number; // For sorting who is first
}

export interface Tower extends Entity {
  towerType: TowerType;
  level: number;
  cooldown: number;
  range: number;
  damage: number;
  targetId: string | null;
}

export interface Hero extends Entity {
  targetPos: Vector2 | null; // Where the hero is walking to
  isMoving: boolean;
  cooldowns: {
    emp: number;
    overclock: number;
  };
}

export interface Projectile extends Entity {
  targetId: string;
  damage: number;
  speed: number;
  effect?: 'freeze' | 'chain';
  startPos: Vector2;
  progress: number; // 0 to 1
}

export interface GameState {
  wave: number;
  energy: number;
  coreHp: number;
  maxCoreHp: number;
  isPlaying: boolean;
  isGameOver: boolean;
  isVictory: boolean;
  gameSpeed: number;
}

export interface MapData {
  grid: TileType[][];
  path: Vector2[];
  width: number;
  height: number;
}
