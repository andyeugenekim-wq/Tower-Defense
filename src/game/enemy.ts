import { DEATH_FADE_DURATION, ENEMY_TYPES } from './constants';
import type { Enemy, Point, RuntimeGameState } from './gameTypes';
import { distance, getPositionOnPath, getTotalPathLength } from './geometry';
import { getPathSegments } from './geometry';

const pathSegments = getPathSegments();
const totalPathLength = getTotalPathLength();

export function createEnemy(typeId: string, id: number): Enemy {
  const type = ENEMY_TYPES[typeId];
  return {
    id,
    typeId,
    hp: type.hp,
    maxHp: type.hp,
    speed: type.speed,
    reward: type.reward,
    damageToPlayer: type.damageToPlayer,
    radius: type.radius,
    color: type.color,
    accentColor: type.accentColor,
    isBoss: Boolean(type.isBoss),
    distanceTraveled: 0,
    alive: true,
    escaped: false,
    hitFlash: 0,
    deathFade: 0,
  };
}

export function updateEnemies(state: RuntimeGameState, dt: number): void {
  for (const enemy of state.enemies) {
    if (enemy.alive) {
      enemy.distanceTraveled += enemy.speed * dt;
      enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);

      if (enemy.distanceTraveled >= totalPathLength) {
        enemy.alive = false;
        enemy.escaped = true;
        state.health -= enemy.damageToPlayer;
      }
    } else if (enemy.deathFade > 0) {
      enemy.deathFade = Math.max(0, enemy.deathFade - dt);
    }
  }
}

export function getEnemyPosition(enemy: Enemy) {
  return getPositionOnPath(enemy.distanceTraveled, pathSegments);
}

export function getAliveEnemies(state: RuntimeGameState): Enemy[] {
  return state.enemies.filter((enemy) => enemy.alive && !enemy.escaped);
}

export function removeDeadEnemies(state: RuntimeGameState): void {
  state.enemies = state.enemies.filter(
    (enemy) =>
      (enemy.alive && !enemy.escaped) ||
      (!enemy.alive && !enemy.escaped && enemy.deathFade > 0),
  );
}

export function getEnemyProgressValue(enemy: Enemy): number {
  return enemy.distanceTraveled / totalPathLength;
}

export function getEnemyAtPoint(state: RuntimeGameState, point: Point): Enemy | null {
  const candidates = getAliveEnemies(state);
  for (let i = candidates.length - 1; i >= 0; i -= 1) {
    const enemy = candidates[i];
    const pos = getEnemyPosition(enemy);
    if (distance(point, pos) <= enemy.radius + 6) {
      return enemy;
    }
  }
  return null;
}

export function startEnemyDeath(enemy: Enemy): void {
  enemy.alive = false;
  enemy.deathFade = DEATH_FADE_DURATION;
}

export { totalPathLength, pathSegments };
