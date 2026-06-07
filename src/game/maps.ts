import { CANVAS_HEIGHT, CANVAS_WIDTH, STARTING_HEALTH, STARTING_MONEY } from './constants';
import type { MapTheme, Point, Wave } from './gameTypes';

export interface MapDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  pathWaypoints: Point[];
  waves: Wave[];
  theme: MapTheme;
  startingMoney?: number;
  startingHealth?: number;
}

function mapPoint(xPct: number, yPct: number): Point {
  return {
    x: Math.round((xPct / 100) * CANVAS_WIDTH),
    y: Math.round((yPct / 100) * CANVAS_HEIGHT),
  };
}

export const DEFAULT_WAVES: Wave[] = [
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

const meadowTheme: MapTheme = {
  background: ['#4a9e4f', '#3d8b40', '#358038'],
  pathColor: ['#b8b8b8', '#a8a29e', '#9ca3af'],
};

export const MAPS: Record<string, MapDefinition> = {
  meadowCrossing: {
    id: 'meadowCrossing',
    name: 'Meadow Crossing',
    description: 'Twin loops and S-bends through open grassland.',
    difficulty: 'Medium',
    pathWaypoints: [
      mapPoint(0, 45),
      mapPoint(32, 45),
      mapPoint(55, 45),
      mapPoint(55, 15),
      mapPoint(32, 15),
      mapPoint(32, 45),
      mapPoint(32, 60),
      mapPoint(32, 85),
      mapPoint(15, 85),
      mapPoint(15, 60),
      mapPoint(32, 60),
      mapPoint(65, 60),
      mapPoint(65, 35),
      mapPoint(80, 35),
      mapPoint(80, 75),
      mapPoint(45, 75),
      mapPoint(45, 100),
    ],
    waves: DEFAULT_WAVES,
    theme: meadowTheme,
  },
};

export const MAP_LIST: MapDefinition[] = [MAPS.meadowCrossing];

export const DEFAULT_MAP_ID = 'meadowCrossing';

export function getMapById(mapId: string): MapDefinition {
  return MAPS[mapId] ?? MAPS[DEFAULT_MAP_ID];
}

export function getMapStartingMoney(map: MapDefinition): number {
  return map.startingMoney ?? STARTING_MONEY;
}

export function getMapStartingHealth(map: MapDefinition): number {
  return map.startingHealth ?? STARTING_HEALTH;
}
