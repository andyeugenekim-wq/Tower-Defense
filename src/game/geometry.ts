import type { PathSegment, Point } from './gameTypes';
import { PATH_WAYPOINTS } from './constants';

export function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.hypot(dx, dy);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function getPathSegments(): PathSegment[] {
  const segments: PathSegment[] = [];
  for (let i = 0; i < PATH_WAYPOINTS.length - 1; i += 1) {
    const start = PATH_WAYPOINTS[i];
    const end = PATH_WAYPOINTS[i + 1];
    segments.push({
      start,
      end,
      length: distance(start, end),
    });
  }
  return segments;
}

export function getTotalPathLength(): number {
  return getPathSegments().reduce((sum, segment) => sum + segment.length, 0);
}

export function getClosestPointOnSegment(
  point: Point,
  start: Point,
  end: Point,
): { point: Point; distance: number; t: number } {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    const dist = distance(point, start);
    return { point: { ...start }, distance: dist, t: 0 };
  }

  let t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared;
  t = clamp(t, 0, 1);

  const closest = {
    x: start.x + t * dx,
    y: start.y + t * dy,
  };

  return {
    point: closest,
    distance: distance(point, closest),
    t,
  };
}

export function getDistanceToPath(point: Point, segments: PathSegment[]): number {
  let minDistance = Infinity;
  for (const segment of segments) {
    const { distance: dist } = getClosestPointOnSegment(
      point,
      segment.start,
      segment.end,
    );
    if (dist < minDistance) {
      minDistance = dist;
    }
  }
  return minDistance;
}

export function getPositionOnPath(
  distanceTraveled: number,
  segments: PathSegment[],
): Point {
  let remaining = distanceTraveled;

  for (const segment of segments) {
    if (remaining <= segment.length) {
      const t = segment.length === 0 ? 0 : remaining / segment.length;
      return {
        x: segment.start.x + (segment.end.x - segment.start.x) * t,
        y: segment.start.y + (segment.end.y - segment.start.y) * t,
      };
    }
    remaining -= segment.length;
  }

  const last = PATH_WAYPOINTS[PATH_WAYPOINTS.length - 1];
  return { ...last };
}

export function getEnemyProgress(distanceTraveled: number, totalLength: number): number {
  if (totalLength <= 0) return 0;
  return distanceTraveled / totalLength;
}

export function isInsideCanvas(
  point: Point,
  width: number,
  height: number,
  margin = 0,
): boolean {
  return (
    point.x >= margin &&
    point.x <= width - margin &&
    point.y >= margin &&
    point.y <= height - margin
  );
}

export function canvasToPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}
