import type { RuntimeGameState } from './gameTypes';
import { updateEnemies, removeDeadEnemies } from './enemy';
import { getUpgradeInfo, updateTowers } from './tower';
import {
  updateFloatingTexts,
  updateNotifications,
  updateProjectiles,
} from './projectile';
import {
  checkDefeat,
  getEnemiesRemaining,
  updateWaveManager,
  updateWaveMessage,
} from './waveManager';

export function updateGame(state: RuntimeGameState, rawDt: number): void {
  if (state.screenState !== 'playing' || state.paused) return;

  const dt = rawDt * state.gameSpeed;

  updateWaveManager(state, dt);
  updateEnemies(state, dt);
  updateTowers(state, dt);
  updateProjectiles(state, dt);
  removeDeadEnemies(state);
  updateFloatingTexts(state, dt);
  updateNotifications(state, dt);
  updateWaveMessage(state, dt);
  checkDefeat(state);
}

export function getSnapshot(
  state: RuntimeGameState,
  selectedTowerId: number | null,
) {
  const selectedTower =
    selectedTowerId !== null
      ? state.towers.find((tower) => tower.id === selectedTowerId) ?? null
      : null;

  return {
    money: state.money,
    health: state.health,
    currentWave: state.currentWave,
    enemiesRemaining: getEnemiesRemaining(state),
    waveStatus: state.waveStatus,
    waveMessage: state.waveMessage,
    paused: state.paused,
    gameSpeed: state.gameSpeed,
    selectedTowerInfo: selectedTower ? getUpgradeInfo(selectedTower) : null,
    notifications: [...state.notifications],
  };
}
