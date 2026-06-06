import type { EnemyType, Point, TowerType, Wave } from './gameTypes';

export const CANVAS_WIDTH = 900;
export const CANVAS_HEIGHT = 480;

export const STARTING_MONEY = 500;
export const STARTING_HEALTH = 100;
export const TOTAL_WAVES = 5;

export const TRACK_WIDTH = 70;
export const TOWER_RADIUS = 24;
export const TOWER_PADDING = 8;

export const SPAWN_INTERVAL = 0.8;
export const PROJECTILE_HIT_RADIUS = 10;
export const DEATH_FADE_DURATION = 0.4;

export const PATH_WAYPOINTS: Point[] = [
  { x: 0, y: 300 },
  { x: 180, y: 300 },
  { x: 180, y: 120 },
  { x: 430, y: 120 },
  { x: 430, y: 420 },
  { x: 700, y: 420 },
  { x: 700, y: 220 },
  { x: 900, y: 220 },
];

export const ENEMY_TYPES: Record<string, EnemyType> = {
  scout: {
    id: 'scout',
    name: 'Scout',
    hp: 40,
    speed: 90,
    reward: 20,
    damageToPlayer: 5,
    radius: 12,
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
    radius: 16,
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
    radius: 20,
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
    radius: 32,
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
    range: 130,
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
    range: 110,
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
    range: 160,
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
    rangeBonus: 15,
    attackSpeedMultiplier: 1.15,
  },
  {
    level: 2,
    costMultiplier: 1.2,
    damageMultiplier: 1.75,
    rangeBonus: 30,
    attackSpeedMultiplier: 1.35,
  },
  {
    level: 3,
    costMultiplier: 1.8,
    damageMultiplier: 2.35,
    rangeBonus: 50,
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
