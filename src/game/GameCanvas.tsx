import { useCallback, useEffect, useRef } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import type { DragState, GameSnapshot } from './gameTypes';
import { canvasToPoint } from './geometry';
import { updateGame, getSnapshot } from './gameLoop';
import { renderGame } from './renderer';
import { createInitialState, resetGameState, startWave } from './waveManager';
import { getEnemyAtPoint } from './enemy';
import {
  getTowerAtPoint,
  placeTower,
  sellTower,
  upgradeTower,
} from './tower';

interface GameCanvasProps {
  active: boolean;
  onSnapshot: (snapshot: GameSnapshot) => void;
  onGameOver: (result: 'victory' | 'defeat') => void;
  onSelectTower: (towerId: number | null) => void;
  selectedTowerId: number | null;
  dragTypeId: string | null;
  onDragEnd: () => void;
  startWaveRequest: number;
  resetRequest: number;
  resetPreserveAutoStart: boolean;
  upgradeRequest: number;
  sellRequest: { towerId: number; nonce: number } | null;
  paused: boolean;
  gameSpeed: number;
  autoStartWaves: boolean;
}

export function GameCanvas({
  active,
  onSnapshot,
  onGameOver,
  onSelectTower,
  selectedTowerId,
  dragTypeId,
  onDragEnd,
  startWaveRequest,
  resetRequest,
  resetPreserveAutoStart,
  upgradeRequest,
  sellRequest,
  paused,
  gameSpeed,
  autoStartWaves,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(createInitialState());
  const dragRef = useRef<DragState>({ typeId: null, x: 0, y: 0, active: false });
  const hoveredEnemyIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const frameRef = useRef(0);
  const snapshotTimerRef = useRef(0);
  const prevScreenRef = useRef<'playing' | 'victory' | 'defeat'>('playing');
  const prevStartWaveRef = useRef(0);
  const prevResetRef = useRef(0);
  const prevUpgradeRef = useRef(0);
  const prevSellNonceRef = useRef(0);

  useEffect(() => {
    stateRef.current.paused = paused;
  }, [paused]);

  useEffect(() => {
    stateRef.current.gameSpeed = gameSpeed;
  }, [gameSpeed]);

  useEffect(() => {
    stateRef.current.autoStartWaves = autoStartWaves;
  }, [autoStartWaves]);

  useEffect(() => {
    stateRef.current.selectedTowerId = selectedTowerId;
  }, [selectedTowerId]);

  useEffect(() => {
    if (startWaveRequest !== prevStartWaveRef.current) {
      prevStartWaveRef.current = startWaveRequest;
      startWave(stateRef.current);
    }
  }, [startWaveRequest]);

  useEffect(() => {
    if (resetRequest !== prevResetRef.current) {
      prevResetRef.current = resetRequest;
      resetGameState(stateRef.current, resetPreserveAutoStart);
      dragRef.current = { typeId: null, x: 0, y: 0, active: false };
      hoveredEnemyIdRef.current = null;
      onSelectTower(null);
    }
  }, [resetRequest, resetPreserveAutoStart, onSelectTower]);

  useEffect(() => {
    if (upgradeRequest !== prevUpgradeRef.current && selectedTowerId !== null) {
      prevUpgradeRef.current = upgradeRequest;
      upgradeTower(stateRef.current, selectedTowerId);
    }
  }, [upgradeRequest, selectedTowerId]);

  useEffect(() => {
    if (!sellRequest || sellRequest.nonce === prevSellNonceRef.current) return;
    prevSellNonceRef.current = sellRequest.nonce;
    sellTower(stateRef.current, sellRequest.towerId);
  }, [sellRequest]);

  useEffect(() => {
    if (dragTypeId) {
      dragRef.current = {
        typeId: dragTypeId,
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT / 2,
        active: true,
      };
    } else {
      dragRef.current.active = false;
      dragRef.current.typeId = null;
    }
  }, [dragTypeId]);

  const updateHover = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const insideCanvas =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;

    if (!insideCanvas) {
      hoveredEnemyIdRef.current = null;
      return;
    }

    const point = canvasToPoint(clientX, clientY, canvas);
    const enemy = getEnemyAtPoint(stateRef.current, point);
    hoveredEnemyIdRef.current = enemy?.id ?? null;
  }, []);

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      updateHover(clientX, clientY);

      const canvas = canvasRef.current;
      if (!canvas || !dragRef.current.active) return;
      const point = canvasToPoint(clientX, clientY, canvas);
      dragRef.current.x = point.x;
      dragRef.current.y = point.y;
    },
    [updateHover],
  );

  const handlePointerUp = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (dragRef.current.active && dragRef.current.typeId) {
        const point = canvasToPoint(clientX, clientY, canvas);
        const rect = canvas.getBoundingClientRect();
        const inside =
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom;

        if (inside) {
          placeTower(stateRef.current, dragRef.current.typeId, point);
        }

        dragRef.current.active = false;
        dragRef.current.typeId = null;
        onDragEnd();
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const insideCanvas =
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom;

      if (!insideCanvas) return;

      const point = canvasToPoint(clientX, clientY, canvas);
      const tower = getTowerAtPoint(stateRef.current, point);
      onSelectTower(tower?.id ?? null);
    },
    [onDragEnd, onSelectTower],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => handlePointerMove(e.clientX, e.clientY);
    const onUp = (e: PointerEvent) => handlePointerUp(e.clientX, e.clientY);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!active) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    const loop = (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        frameRef.current = requestAnimationFrame(loop);
        return;
      }

      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const rawDt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      updateGame(stateRef.current, rawDt);
      renderGame(
        ctx,
        stateRef.current,
        dragRef.current.active ? dragRef.current : null,
        hoveredEnemyIdRef.current,
      );

      snapshotTimerRef.current += rawDt;
      if (snapshotTimerRef.current >= 0.1) {
        snapshotTimerRef.current = 0;
        onSnapshot(getSnapshot(stateRef.current, selectedTowerId));
      }

      const screen = stateRef.current.screenState;
      if (screen !== prevScreenRef.current && screen !== 'playing') {
        onGameOver(screen);
      }
      prevScreenRef.current = screen === 'playing' ? 'playing' : screen;

      frameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = 0;
    frameRef.current = requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [active, onSnapshot, onGameOver, selectedTowerId]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="game-canvas"
    />
  );
}
