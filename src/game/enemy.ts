import { ENEMY_TYPES } from './constants';
import type { Enemy, RuntimeGameState } from './gameTypes';
import { getPositionOnPath, getTotalPathLength } from './geometry';
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
  };
}

export function updateEnemies(state: RuntimeGameState, dt: number): void {
  for (const enemy of state.enemies) {
    if (!enemy.alive) continue;

    enemy.distanceTraveled += enemy.speed * dt;
    enemy.hitFlash = Math.max(0, enemy.hitFlash - dt * 4);

    if (enemy.distanceTraveled >= totalPathLength) {
      enemy.alive = false;
      enemy.escaped = true;
      state.health -= enemy.damageToPlayer;
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
    (enemy) => enemy.alive || enemy.hitFlash > 0,
  );
}

export function getEnemyProgressValue(enemy: Enemy): number {
  return enemy.distanceTraveled / totalPathLength;
}

export { totalPathLength, pathSegments };
