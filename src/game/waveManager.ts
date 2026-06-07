import { SPAWN_INTERVAL } from './constants';
import { createEnemy } from './enemy';
import type { RuntimeGameState } from './gameTypes';
import { getAliveEnemies } from './enemy';
import { playWaveCompleteSound } from './audio';
import {
  getMapById,
  getMapStartingHealth,
  getMapStartingMoney,
} from './maps';
import { getPathSegments, getTotalPathLength } from './geometry';

export function createInitialState(mapId: string): RuntimeGameState {
  const map = getMapById(mapId);
  const pathSegments = getPathSegments(map.pathWaypoints);

  return {
    mapId: map.id,
    mapName: map.name,
    pathWaypoints: map.pathWaypoints,
    pathSegments,
    totalPathLength: getTotalPathLength(pathSegments),
    waves: map.waves,
    totalWaves: map.waves.length,
    mapTheme: map.theme,
    money: getMapStartingMoney(map),
    health: getMapStartingHealth(map),
    currentWave: 1,
    waveStatus: 'waiting',
    waveMessage: 'Place towers, then start the wave',
    waveMessageTimer: 0,
    paused: false,
    gameSpeed: 1,
    screenState: 'playing',
    enemies: [],
    towers: [],
    projectiles: [],
    floatingTexts: [],
    notifications: [],
    selectedTowerId: null,
    nextEnemyId: 1,
    nextTowerId: 1,
    nextProjectileId: 1,
    nextFloatingTextId: 1,
    nextNotificationId: 1,
    spawnQueue: [],
    spawnTimer: 0,
    waveSpawnedCount: 0,
    waveTotalCount: 0,
    waveActive: false,
    waveCompletePending: false,
    bossWarningShown: false,
    autoStartWaves: false,
  };
}

export function resetGameState(
  state: RuntimeGameState,
  mapId: string,
  preserveAutoStart = false,
): void {
  const autoStartWaves = preserveAutoStart ? state.autoStartWaves : false;
  const fresh = createInitialState(mapId);
  Object.assign(state, fresh);
  state.autoStartWaves = autoStartWaves;
}

export function buildSpawnQueue(state: RuntimeGameState, waveNumber: number): string[] {
  const wave = state.waves[waveNumber - 1];
  if (!wave) return [];

  const queue: string[] = [];
  for (const spawn of wave.spawns) {
    for (let i = 0; i < spawn.count; i += 1) {
      queue.push(spawn.typeId);
    }
  }
  return queue;
}

export function getWaveTotalCount(state: RuntimeGameState, waveNumber: number): number {
  const wave = state.waves[waveNumber - 1];
  if (!wave) return 0;
  return wave.spawns.reduce((sum, spawn) => sum + spawn.count, 0);
}

export function startWave(state: RuntimeGameState): void {
  if (state.waveActive || state.waveStatus === 'spawning') return;
  if (state.currentWave > state.totalWaves) return;

  if (state.currentWave === state.totalWaves && !state.bossWarningShown) {
    state.bossWarningShown = true;
    pushNotification(state, '⚠ Final Boss incoming this wave!', 'warning');
  }

  state.spawnQueue = buildSpawnQueue(state, state.currentWave);
  state.waveTotalCount = state.spawnQueue.length;
  state.waveSpawnedCount = 0;
  state.spawnTimer = 0;
  state.waveActive = true;
  state.waveCompletePending = false;
  state.waveStatus = 'spawning';
  state.waveMessage = `Wave ${state.currentWave} in progress`;
}

export function updateWaveManager(state: RuntimeGameState, dt: number): void {
  if (!state.waveActive) return;

  if (state.spawnQueue.length > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const typeId = state.spawnQueue.shift();
      if (typeId) {
        state.enemies.push(createEnemy(typeId, state.nextEnemyId++));
        state.waveSpawnedCount += 1;
      }
      state.spawnTimer = SPAWN_INTERVAL;
    }
    state.waveStatus = 'spawning';
  } else {
    state.waveStatus = 'active';
  }

  const aliveEnemies = getAliveEnemies(state);
  const allSpawned = state.waveSpawnedCount >= state.waveTotalCount;

  if (allSpawned && aliveEnemies.length === 0 && !state.waveCompletePending) {
    state.waveCompletePending = true;
    completeWave(state);
  }
}

function completeWave(state: RuntimeGameState): void {
  const wave = state.waves[state.currentWave - 1];
  state.waveActive = false;

  if (state.currentWave >= state.totalWaves) {
    state.waveStatus = 'complete';
    state.waveMessage = 'Victory!';
    state.screenState = 'victory';
    pushNotification(state, '🎉 Victory! All waves cleared!', 'success');
    return;
  }

  const bonus = wave?.bonus ?? 0;
  state.money += bonus;
  state.waveStatus = 'between';
  state.waveMessage = `Wave Complete! +$${bonus}`;
  state.waveMessageTimer = 3;
  playWaveCompleteSound();
  pushNotification(state, `Wave Complete! +$${bonus}`, 'success');

  state.currentWave += 1;
}

export function getEnemiesRemaining(state: RuntimeGameState): number {
  const alive = getAliveEnemies(state).length;
  const queued = state.spawnQueue.length;
  return alive + queued;
}

export function updateWaveMessage(state: RuntimeGameState, dt: number): void {
  if (state.waveMessageTimer > 0) {
    state.waveMessageTimer -= dt;
    if (state.waveMessageTimer <= 0 && state.waveStatus === 'between') {
      state.waveStatus = 'waiting';
      state.waveMessage = state.autoStartWaves
        ? 'Starting next wave...'
        : 'Place towers, then start the next wave';
      if (state.autoStartWaves) {
        startWave(state);
      }
    }
  }
}

export function checkDefeat(state: RuntimeGameState): void {
  if (state.health <= 0 && state.screenState === 'playing') {
    state.screenState = 'defeat';
    state.waveStatus = 'complete';
    state.waveMessage = 'Defeat';
    pushNotification(state, 'Defeat! Your base has fallen.', 'error');
  }
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
    life: 3,
  });
}

export function addNotification(
  state: RuntimeGameState,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error',
): void {
  pushNotification(state, message, type);
}
