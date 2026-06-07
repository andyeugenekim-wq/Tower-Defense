import type { EnemyType, Point, TowerType, Wave } from './gameTypes';

export const CANVAS_WIDTH = 1400;
export const CANVAS_HEIGHT = 788;

export const STARTING_MONEY = 500;
export const STARTING_HEALTH = 100;
export const TOTAL_WAVES = 5;

/** Visual scale factor relative to the original 900px-wide map */
export const MAP_SCALE = CANVAS_WIDTH / 900;

export const TRACK_WIDTH = 56;
export const TOWER_RADIUS = 15;
export const TOWER_PADDING = 5;
export const TOWER_ICON_SCALE = TOWER_RADIUS / 24;

export const SPAWN_INTERVAL = 0.8;
export const PROJECTILE_HIT_RADIUS = 8;
export const DEATH_FADE_DURATION = 0.4;

/** Convert reference-map percentage (0–100) to canvas coordinates */
function mapPoint(xPct: number, yPct: number): { x: number; y: number } {
  return {
    x: Math.round((xPct / 100) * CANVAS_WIDTH),
    y: Math.round((yPct / 100) * CANVAS_HEIGHT),
  };
}

/**
 * "Meadow Crossing" — traced from the reference layout.
 * Entry left-center, two self-crossing loops on the left, S-bends on the right,
 * exit bottom-center. Enemies follow the arrow flow (no arrows drawn).
 */
export const PATH_WAYPOINTS: Point[] = [
  mapPoint(0, 45),   // entrance — left edge
  mapPoint(32, 45),  // intersection 1 (entry horizontal)
  mapPoint(55, 45),  // upper loop: turn up
  mapPoint(55, 15),
  mapPoint(32, 15),
  mapPoint(32, 45),  // vertical down through intersection 1
  mapPoint(32, 60),  // intersection 2
  mapPoint(32, 85),  // lower loop: turn left
  mapPoint(15, 85),
  mapPoint(15, 60),
  mapPoint(32, 60),  // horizontal crossing at intersection 2
  mapPoint(65, 60),  // right-side bends begin
  mapPoint(65, 35),
  mapPoint(80, 35),
  mapPoint(80, 75),
  mapPoint(45, 75),
  mapPoint(45, 100), // exit — bottom center
];

export const ENEMY_TYPES: Record<string, EnemyType> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    hp: 40,
    speed: 90,
    reward: 20,
    damageToPlayer: 5,
    radius: 9,
    color: '#ff6b6b',
    accentColor: '#ffe066',
  },
  bruiser: {
    id: 'bruiser',
    name: 'Bruiser',
    hp: 100,
    speed: 55,
    reward: 40,
    damageToPlayer: 10,
    radius: 12,
    color: '#e67e22',
    accentColor: '#d35400',
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    hp: 220,
    speed: 35,
    reward: 75,
    damageToPlayer: 20,
    radius: 16,
    color: '#5d4e6d',
    accentColor: '#95a5a6',
  },
  boss: {
    id: 'boss',
    name: 'Final Boss',
    hp: 1200,
    speed: 20,
    reward: 300,
    damageToPlayer: 50,
    radius: 26,
    color: '#8e44ad',
    accentColor: '#e74c3c',
    isBoss: true,
  },
};

export const TOWER_TYPES: Record<string, TowerType> = {
  archer: {
    id: 'archer',
    name: 'Archer Tower',
    cost: 100,
    range: 195,
    damage: 20,
    attackSpeed: 1.0,
    projectileSpeed: 350,
    color: '#8B6914',
    accentColor: '#4a7c59',
    projectileColor: '#f5deb3',
  },
  cannon: {
    id: 'cannon',
    name: 'Cannon Tower',
    cost: 180,
    range: 165,
    damage: 55,
    attackSpeed: 0.55,
    projectileSpeed: 260,
    color: '#4a5568',
    accentColor: '#718096',
    projectileColor: '#2d3748',
  },
  tesla: {
    id: 'tesla',
    name: 'Tesla Tower',
    cost: 250,
    range: 245,
    damage: 30,
    attackSpeed: 1.6,
    projectileSpeed: 500,
    color: '#3182ce',
    accentColor: '#63b3ed',
    projectileColor: '#90cdf4',
  },
};

export const UPGRADE_CONFIG = [
  {
    level: 1,
    costMultiplier: 0.8,
    damageMultiplier: 1.35,
    rangeBonus: 22,
    attackSpeedMultiplier: 1.15,
  },
  {
    level: 2,
    costMultiplier: 1.2,
    damageMultiplier: 1.75,
    rangeBonus: 46,
    attackSpeedMultiplier: 1.35,
  },
  {
    level: 3,
    costMultiplier: 1.8,
    damageMultiplier: 2.35,
    rangeBonus: 78,
    attackSpeedMultiplier: 1.65,
  },
];

export const WAVES: Wave[] = [
  {
    number: 1,
    spawns: [{ typeId: 'scout', count: 8 }],
    bonus: 75,
  },
  {
    number: 2,
    spawns: [
      { typeId: 'scout', count: 10 },
      { typeId: 'bruiser', count: 4 },
    ],
    bonus: 100,
  },
  {
    number: 3,
    spawns: [
      { typeId: 'scout', count: 12 },
      { typeId: 'bruiser', count: 8 },
      { typeId: 'tank', count: 2 },
    ],
    bonus: 125,
  },
  {
    number: 4,
    spawns: [
      { typeId: 'scout', count: 10 },
      { typeId: 'bruiser', count: 10 },
      { typeId: 'tank', count: 6 },
    ],
    bonus: 150,
  },
  {
    number: 5,
    spawns: [
      { typeId: 'scout', count: 12 },
      { typeId: 'bruiser', count: 12 },
      { typeId: 'tank', count: 8 },
      { typeId: 'boss', count: 1 },
    ],
    bonus: 0,
  },
];

export const TOWER_SHOP_ORDER = ['archer', 'cannon', 'tesla'] as const;
