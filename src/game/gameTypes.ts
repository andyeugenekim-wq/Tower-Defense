export interface Point {
  x: number;
  y: number;
}

export interface EnemyType {
  id: string;
  name: string;
  hp: number;
  speed: number;
  reward: number;
  damageToPlayer: number;
  radius: number;
  color: string;
  accentColor: string;
  isBoss?: boolean;
}

export interface Enemy {
  id: number;
  typeId: string;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  damageToPlayer: number;
  radius: number;
  color: string;
  accentColor: string;
  isBoss: boolean;
  distanceTraveled: number;
  alive: boolean;
  escaped: boolean;
  hitFlash: number;
  deathFade: number;
}

export interface TowerType {
  id: string;
  name: string;
  cost: number;
  range: number;
  damage: number;
  attackSpeed: number;
  projectileSpeed: number;
  color: string;
  accentColor: string;
  projectileColor: string;
}

export interface Tower {
  id: number;
  typeId: string;
  x: number;
  y: number;
  level: number;
  totalSpent: number;
  cooldown: number;
  muzzleFlash: number;
}

export interface Projectile {
  id: number;
  towerId: number;
  x: number;
  y: number;
  targetEnemyId: number;
  speed: number;
  damage: number;
  color: string;
  trail: Point[];
  hit: boolean;
}

export interface WaveEnemySpawn {
  typeId: string;
  count: number;
}

export interface Wave {
  number: number;
  spawns: WaveEnemySpawn[];
  bonus: number;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  life: number;
}

export interface PathSegment {
  start: Point;
  end: Point;
  length: number;
}

export type ScreenState = 'home' | 'playing' | 'victory' | 'defeat';

export type WaveStatus =
  | 'waiting'
  | 'spawning'
  | 'active'
  | 'complete'
  | 'between';

export interface GameSnapshot {
  money: number;
  health: number;
  currentWave: number;
  totalWaves: number;
  mapName: string;
  waveStatus: WaveStatus;
  waveMessage: string;
  paused: boolean;
  gameSpeed: number;
  autoStartWaves: boolean;
  selectedTowerInfo: UpgradeInfo | null;
  notifications: Notification[];
}

export interface DragState {
  typeId: string | null;
  x: number;
  y: number;
  active: boolean;
}

export interface UpgradeInfo {
  tower: Tower;
  name: string;
  damage: number;
  range: number;
  attackSpeed: number;
  upgradeCost: number | null;
  sellValue: number;
  canUpgrade: boolean;
}

export interface MapTheme {
  background: [string, string, string];
  pathColor: [string, string, string];
}

export interface RuntimeGameState {
  mapId: string;
  mapName: string;
  pathWaypoints: Point[];
  pathSegments: PathSegment[];
  totalPathLength: number;
  waves: Wave[];
  totalWaves: number;
  mapTheme: MapTheme;
  money: number;
  health: number;
  currentWave: number;
  waveStatus: WaveStatus;
  waveMessage: string;
  waveMessageTimer: number;
  paused: boolean;
  gameSpeed: number;
  screenState: ScreenState;
  enemies: Enemy[];
  towers: Tower[];
  projectiles: Projectile[];
  floatingTexts: FloatingText[];
  notifications: Notification[];
  selectedTowerId: number | null;
  nextEnemyId: number;
  nextTowerId: number;
  nextProjectileId: number;
  nextFloatingTextId: number;
  nextNotificationId: number;
  spawnQueue: string[];
  spawnTimer: number;
  waveSpawnedCount: number;
  waveTotalCount: number;
  waveActive: boolean;
  waveCompletePending: boolean;
  bossWarningShown: boolean;
  autoStartWaves: boolean;
}
