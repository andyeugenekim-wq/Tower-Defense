import { PROJECTILE_HIT_RADIUS } from './constants';
import type { RuntimeGameState } from './gameTypes';
import { getPositionOnPath } from './geometry';
import { playKillSound } from './audio';
import { startEnemyDeath } from './enemy';

export function updateProjectiles(state: RuntimeGameState, dt: number): void {
  const toRemove: number[] = [];

  for (const projectile of state.projectiles) {
    if (projectile.hit) {
      toRemove.push(projectile.id);
      continue;
    }

    const target = state.enemies.find((e) => e.id === projectile.targetEnemyId);
    if (!target || !target.alive || target.escaped) {
      toRemove.push(projectile.id);
      continue;
    }

    const targetPos = getPositionOnPath(
      target.distanceTraveled,
      state.pathSegments,
      state.pathWaypoints,
    );
    const dx = targetPos.x - projectile.x;
    const dy = targetPos.y - projectile.y;
    const dist = Math.hypot(dx, dy);

    if (dist <= PROJECTILE_HIT_RADIUS) {
      if (target.alive && !target.escaped) {
        target.hp -= projectile.damage;
        target.hitFlash = 0.15;

        if (target.hp <= 0 && target.alive) {
          startEnemyDeath(target);
          state.money += target.reward;
          playKillSound();
          state.floatingTexts.push({
            id: state.nextFloatingTextId++,
            x: targetPos.x,
            y: targetPos.y - 20,
            text: `+$${target.reward}`,
            color: '#ffd700',
            life: 1.2,
          });
        }
      }
      projectile.hit = true;
      toRemove.push(projectile.id);
      continue;
    }

    const move = projectile.speed * dt;
    const ratio = move / dist;
    const newX = projectile.x + dx * ratio;
    const newY = projectile.y + dy * ratio;

    projectile.trail.push({ x: projectile.x, y: projectile.y });
    if (projectile.trail.length > 6) {
      projectile.trail.shift();
    }

    projectile.x = newX;
    projectile.y = newY;
  }

  if (toRemove.length > 0) {
    const removeSet = new Set(toRemove);
    state.projectiles = state.projectiles.filter((p) => !removeSet.has(p.id));
  }
}

export function updateFloatingTexts(state: RuntimeGameState, dt: number): void {
  for (const text of state.floatingTexts) {
    text.y -= 30 * dt;
    text.life -= dt;
  }
  state.floatingTexts = state.floatingTexts.filter((text) => text.life > 0);
}

export function updateNotifications(state: RuntimeGameState, dt: number): void {
  for (const notification of state.notifications) {
    notification.life -= dt;
  }
  state.notifications = state.notifications.filter((n) => n.life > 0);
}
