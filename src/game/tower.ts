import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  TOWER_PADDING,
  TOWER_RADIUS,
  TOWER_TYPES,
  TRACK_WIDTH,
  UPGRADE_CONFIG,
} from './constants';
import type { Point, RuntimeGameState, Tower, UpgradeInfo } from './gameTypes';
import { getAliveEnemies, getEnemyProgressValue } from './enemy';
import {
  distance,
  getDistanceToPath,
  getPathSegments,
  getPositionOnPath,
  isInsideCanvas,
} from './geometry';

const pathSegments = getPathSegments();

export function getTowerTypeStats(typeId: string, level: number) {
  const base = TOWER_TYPES[typeId];
  if (level === 0) {
    return {
      damage: base.damage,
      range: base.range,
      attackSpeed: base.attackSpeed,
      projectileSpeed: base.projectileSpeed,
      color: base.color,
      accentColor: base.accentColor,
      projectileColor: base.projectileColor,
      name: base.name,
    };
  }

  const config = UPGRADE_CONFIG[level - 1];
  return {
    damage: Math.round(base.damage * config.damageMultiplier),
    range: base.range + config.rangeBonus,
    attackSpeed: base.attackSpeed * config.attackSpeedMultiplier,
    projectileSpeed: base.projectileSpeed,
    color: base.color,
    accentColor: base.accentColor,
    projectileColor: base.projectileColor,
    name: base.name,
  };
}

export function getUpgradeCost(typeId: string, currentLevel: number): number | null {
  if (currentLevel >= 3) return null;
  const baseCost = TOWER_TYPES[typeId].cost;
  const config = UPGRADE_CONFIG[currentLevel];
  return Math.floor(baseCost * config.costMultiplier);
}

export function getSellValue(tower: Tower): number {
  return Math.floor(tower.totalSpent * (2 / 3));
}

export function canPlaceTower(
  point: Point,
  typeId: string,
  towers: Tower[],
  money: number,
): { valid: boolean; reason?: string } {
  const type = TOWER_TYPES[typeId];
  if (money < type.cost) {
    return { valid: false, reason: 'Not enough money' };
  }

  if (!isInsideCanvas(point, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_RADIUS)) {
    return { valid: false, reason: 'Invalid placement' };
  }

  const distToPath = getDistanceToPath(point, pathSegments);
  if (distToPath < TRACK_WIDTH / 2 + TOWER_RADIUS) {
    return { valid: false, reason: 'Too close to track' };
  }

  for (const tower of towers) {
    const dist = distance(point, { x: tower.x, y: tower.y });
    if (dist < TOWER_RADIUS * 2 + TOWER_PADDING) {
      return { valid: false, reason: 'Tower overlap' };
    }
  }

  return { valid: true };
}

export function placeTower(
  state: RuntimeGameState,
  typeId: string,
  point: Point,
): boolean {
  const check = canPlaceTower(point, typeId, state.towers, state.money);
  if (!check.valid) {
    if (check.reason) {
      pushNotification(state, check.reason, 'warning');
    }
    return false;
  }

  const type = TOWER_TYPES[typeId];
  state.money -= type.cost;
  state.towers.push({
    id: state.nextTowerId++,
    typeId,
    x: point.x,
    y: point.y,
    level: 0,
    totalSpent: type.cost,
    cooldown: 0,
    muzzleFlash: 0,
  });
  return true;
}

export function upgradeTower(state: RuntimeGameState, towerId: number): boolean {
  const tower = state.towers.find((t) => t.id === towerId);
  if (!tower || tower.level >= 3) return false;

  const cost = getUpgradeCost(tower.typeId, tower.level);
  if (cost === null || state.money < cost) {
    pushNotification(state, 'Not enough money', 'warning');
    return false;
  }

  state.money -= cost;
  tower.level += 1;
  tower.totalSpent += cost;
  return true;
}

export function sellTower(state: RuntimeGameState, towerId: number): boolean {
  const index = state.towers.findIndex((t) => t.id === towerId);
  if (index === -1) return false;

  const tower = state.towers[index];
  state.money += getSellValue(tower);
  state.towers.splice(index, 1);
  if (state.selectedTowerId === towerId) {
    state.selectedTowerId = null;
  }
  return true;
}

export function findTargetForTower(state: RuntimeGameState, tower: Tower): number | null {
  const stats = getTowerTypeStats(tower.typeId, tower.level);
  const aliveEnemies = getAliveEnemies(state);

  let bestEnemyId: number | null = null;
  let bestProgress = -1;

  for (const enemy of aliveEnemies) {
    const pos = getPositionOnPath(enemy.distanceTraveled, pathSegments);
    const dist = distance({ x: tower.x, y: tower.y }, pos);
    if (dist > stats.range) continue;

    const progress = getEnemyProgressValue(enemy);
    if (progress > bestProgress) {
      bestProgress = progress;
      bestEnemyId = enemy.id;
    }
  }

  return bestEnemyId;
}

export function updateTowers(state: RuntimeGameState, dt: number): void {
  for (const tower of state.towers) {
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    tower.muzzleFlash = Math.max(0, tower.muzzleFlash - dt * 6);

    const stats = getTowerTypeStats(tower.typeId, tower.level);
    const targetId = findTargetForTower(state, tower);

    if (targetId !== null && tower.cooldown <= 0) {
      const target = state.enemies.find((e) => e.id === targetId);
      if (target && target.alive && !target.escaped) {
        state.projectiles.push({
          id: state.nextProjectileId++,
          towerId: tower.id,
          x: tower.x,
          y: tower.y,
          targetEnemyId: targetId,
          speed: stats.projectileSpeed,
          damage: stats.damage,
          color: stats.projectileColor,
          trail: [],
          hit: false,
        });
        tower.cooldown = 1 / stats.attackSpeed;
        tower.muzzleFlash = 0.12;
      }
    }
  }
}

export function getUpgradeInfo(tower: Tower): UpgradeInfo {
  const stats = getTowerTypeStats(tower.typeId, tower.level);
  const upgradeCost = getUpgradeCost(tower.typeId, tower.level);
  return {
    tower,
    name: stats.name,
    damage: stats.damage,
    range: stats.range,
    attackSpeed: stats.attackSpeed,
    upgradeCost,
    sellValue: getSellValue(tower),
    canUpgrade: tower.level < 3,
  };
}

export function getTowerAtPoint(state: RuntimeGameState, point: Point): Tower | null {
  for (let i = state.towers.length - 1; i >= 0; i -= 1) {
    const tower = state.towers[i];
    if (distance(point, { x: tower.x, y: tower.y }) <= TOWER_RADIUS + 4) {
      return tower;
    }
  }
  return null;
}

function pushNotification(
  state: RuntimeGameState,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
): void {
  state.notifications.push({
    id: state.nextNotificationId++,
    message,
    type,
    life: 2.5,
  });
}
