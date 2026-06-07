import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEATH_FADE_DURATION,
  PATH_WAYPOINTS,
  TOWER_ICON_SCALE,
  TOWER_RADIUS,
  TOWER_TYPES,
  TRACK_WIDTH,
} from './constants';
import type { DragState, RuntimeGameState } from './gameTypes';
import { getEnemyPosition } from './enemy';
import { canPlaceTower, getTowerTypeStats } from './tower';

export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: RuntimeGameState,
  drag: DragState | null,
  hoveredEnemyId: number | null,
): void {
  drawBackground(ctx);
  drawPath(ctx);
  drawEntranceExit(ctx);
  drawTowers(ctx, state);
  drawEnemies(ctx, state, hoveredEnemyId);
  drawProjectiles(ctx, state);
  drawFloatingTexts(ctx, state);
  drawSelectedTower(ctx, state);
  drawDragPreview(ctx, state, drag);
}

function drawBackground(ctx: CanvasRenderingContext2D): void {
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  gradient.addColorStop(0, '#4a9e4f');
  gradient.addColorStop(0.5, '#3d8b40');
  gradient.addColorStop(1, '#358038');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.025)';
  const tileSize = 50;
  for (let x = 0; x < CANVAS_WIDTH; x += tileSize) {
    for (let y = 0; y < CANVAS_HEIGHT; y += tileSize) {
      if ((x / tileSize + y / tileSize) % 2 === 0) {
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }
}

function drawPath(ctx: CanvasRenderingContext2D): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = TRACK_WIDTH + 8;
  ctx.beginPath();
  ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
  for (let i = 1; i < PATH_WAYPOINTS.length; i += 1) {
    ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
  }
  ctx.stroke();

  const pathGradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  pathGradient.addColorStop(0, '#b8b8b8');
  pathGradient.addColorStop(0.5, '#a8a29e');
  pathGradient.addColorStop(1, '#9ca3af');
  ctx.strokeStyle = pathGradient;
  ctx.lineWidth = TRACK_WIDTH;
  ctx.beginPath();
  ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
  for (let i = 1; i < PATH_WAYPOINTS.length; i += 1) {
    ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
  }
  ctx.stroke();

  drawCobblestoneOverlay(ctx);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 12]);
  ctx.beginPath();
  ctx.moveTo(PATH_WAYPOINTS[0].x, PATH_WAYPOINTS[0].y);
  for (let i = 1; i < PATH_WAYPOINTS.length; i += 1) {
    ctx.lineTo(PATH_WAYPOINTS[i].x, PATH_WAYPOINTS[i].y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawCobblestoneOverlay(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(60, 60, 60, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i += 1) {
    const a = PATH_WAYPOINTS[i];
    const b = PATH_WAYPOINTS[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.floor(len / 14);
    for (let s = 0; s <= steps; s += 1) {
      const t = steps === 0 ? 0 : s / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      const offset = ((i * 17 + s * 13) % 5) - 2;
      ctx.strokeRect(x - 4 + offset, y - 3, 8, 6);
    }
  }
  ctx.restore();
}

function drawEntranceExit(ctx: CanvasRenderingContext2D): void {
  const entrance = PATH_WAYPOINTS[0];
  const exit = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];

  drawMarker(ctx, entrance.x + 24, entrance.y, '#4ade80', 'ENTRANCE', 'above');
  drawMarker(ctx, exit.x, exit.y - 22, '#f87171', 'EXIT', 'above');
}

function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  label: string,
  labelPosition: 'above' | 'below' = 'above',
): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.font = 'bold 9px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, labelPosition === 'above' ? y - 18 : y + 22);
  ctx.restore();
}

function drawTowers(ctx: CanvasRenderingContext2D, state: RuntimeGameState): void {
  for (const tower of state.towers) {
    const stats = getTowerTypeStats(tower.typeId, tower.level);
    const isSelected = state.selectedTowerId === tower.id;

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, stats.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 179, 237, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(99, 179, 237, 0.5)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = stats.color;
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, TOWER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    drawTowerIcon(ctx, tower.typeId, tower.x, tower.y, stats.accentColor);

    if (tower.level > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 8px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`L${tower.level}`, tower.x, tower.y + TOWER_RADIUS + 10);
    }

    if (tower.muzzleFlash > 0) {
      ctx.fillStyle = `rgba(255,255,200,${tower.muzzleFlash * 4})`;
      ctx.beginPath();
      ctx.arc(tower.x, tower.y, TOWER_RADIUS + 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

function drawTowerIcon(
  ctx: CanvasRenderingContext2D,
  typeId: string,
  x: number,
  y: number,
  accent: string,
): void {
  const s = TOWER_ICON_SCALE;
  ctx.fillStyle = accent;
  if (typeId === 'archer') {
    ctx.fillRect(x - 3 * s, y - 14 * s, 6 * s, 18 * s);
    ctx.beginPath();
    ctx.moveTo(x, y - 18 * s);
    ctx.lineTo(x - 6 * s, y - 10 * s);
    ctx.lineTo(x + 6 * s, y - 10 * s);
    ctx.closePath();
    ctx.fill();
  } else if (typeId === 'cannon') {
    ctx.fillRect(x - 10 * s, y - 6 * s, 20 * s, 12 * s);
    ctx.fillRect(x + 4 * s, y - 3 * s, 12 * s, 6 * s);
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y - 14 * s);
    ctx.lineTo(x + 10 * s, y + 8 * s);
    ctx.lineTo(x - 10 * s, y + 8 * s);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#bee3f8';
    ctx.lineWidth = Math.max(1, 2 * s);
    ctx.stroke();
  }
}

function drawEnemies(
  ctx: CanvasRenderingContext2D,
  state: RuntimeGameState,
  hoveredEnemyId: number | null,
): void {
  for (const enemy of state.enemies) {
    const isDying = !enemy.alive && enemy.deathFade > 0;
    if (!enemy.alive && !isDying) continue;

    const pos = getEnemyPosition(enemy);
    const fadeAlpha = isDying ? enemy.deathFade / DEATH_FADE_DURATION : 1;
    const scale = isDying ? 0.6 + fadeAlpha * 0.4 : 1;

    ctx.save();
    ctx.globalAlpha = fadeAlpha;

    if (enemy.hitFlash > 0 && enemy.alive) {
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 12;
    }

    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    const drawRadius = enemy.radius * scale;

    if (enemy.isBoss && enemy.alive) {
      ctx.save();
      ctx.shadowColor = 'rgba(142,68,173,0.6)';
      ctx.shadowBlur = 16;
      ctx.arc(pos.x, pos.y, drawRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = enemy.accentColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', pos.x, pos.y - drawRadius - 18);
    } else {
      ctx.arc(pos.x, pos.y, drawRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = enemy.accentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (enemy.alive && enemy.id === hoveredEnemyId) {
      drawHealthBar(
        ctx,
        pos.x,
        pos.y - enemy.radius - 10,
        enemy.hp,
        enemy.maxHp,
        enemy.isBoss ? 56 : 36,
        enemy.isBoss,
      );
    }

    ctx.restore();
  }
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  hp: number,
  maxHp: number,
  width: number,
  isBoss: boolean,
): void {
  const ratio = Math.max(0, hp / maxHp);
  const height = isBoss ? 8 : 5;
  const displayHp = Math.max(0, Math.ceil(hp));
  const label = `${displayHp}/${maxHp} HP`;

  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.font = 'bold 10px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x, y - 4);

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - width / 2, y, width, height);

  let color = '#4ade80';
  if (ratio < 0.3) color = '#ef4444';
  else if (ratio < 0.6) color = '#fbbf24';

  ctx.fillStyle = color;
  ctx.fillRect(x - width / 2, y, width * ratio, height);
}

function drawProjectiles(ctx: CanvasRenderingContext2D, state: RuntimeGameState): void {
  for (const projectile of state.projectiles) {
    for (let i = 0; i < projectile.trail.length; i += 1) {
      const point = projectile.trail[i];
      const alpha = ((i + 1) / projectile.trail.length) * 0.45;
      ctx.fillStyle = projectile.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.save();
    ctx.shadowColor = projectile.color;
    ctx.shadowBlur = 8;
    ctx.fillStyle = projectile.color;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloatingTexts(ctx: CanvasRenderingContext2D, state: RuntimeGameState): void {
  for (const text of state.floatingTexts) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, text.life);
    ctx.fillStyle = text.color;
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText(text.text, text.x, text.y);
    ctx.restore();
  }
}

function drawSelectedTower(ctx: CanvasRenderingContext2D, state: RuntimeGameState): void {
  if (state.selectedTowerId === null) return;
  const tower = state.towers.find((t) => t.id === state.selectedTowerId);
  if (!tower) return;

  ctx.strokeStyle = '#63b3ed';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.arc(tower.x, tower.y, TOWER_RADIUS + 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDragPreview(
  ctx: CanvasRenderingContext2D,
  state: RuntimeGameState,
  drag: DragState | null,
): void {
  if (!drag?.active || !drag.typeId) return;

  const type = TOWER_TYPES[drag.typeId];
  const check = canPlaceTower(
    { x: drag.x, y: drag.y },
    drag.typeId,
    state.towers,
    state.money,
  );
  const valid = check.valid;

  ctx.beginPath();
  ctx.arc(drag.x, drag.y, type.range, 0, Math.PI * 2);
  ctx.fillStyle = valid ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)';
  ctx.fill();
  ctx.strokeStyle = valid ? 'rgba(74, 222, 128, 0.6)' : 'rgba(248, 113, 113, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = valid ? type.color : '#ef4444';
  ctx.beginPath();
  ctx.arc(drag.x, drag.y, TOWER_RADIUS, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
