import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';
import type { GameSnapshot, ScreenState, UpgradeInfo } from './game/gameTypes';
import { TOWER_SHOP_ORDER, TOWER_TYPES, TOTAL_WAVES } from './game/constants';
import { resumeAudio } from './game/audio';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('home');
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    money: 500,
    health: 100,
    currentWave: 1,
    enemiesRemaining: 0,
    waveStatus: 'waiting',
    waveMessage: 'Place towers, then start the wave',
    paused: false,
    gameSpeed: 1,
    selectedTowerInfo: null,
    notifications: [],
  });
  const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null);
  const [dragTypeId, setDragTypeId] = useState<string | null>(null);
  const [startWaveRequest, setStartWaveRequest] = useState(0);
  const [resetRequest, setResetRequest] = useState(0);
  const [upgradeRequest, setUpgradeRequest] = useState(0);
  const [sellRequest, setSellRequest] = useState(0);

  const handleSnapshot = useCallback((next: GameSnapshot) => {
    setSnapshot(next);
  }, []);

  const handleGameOver = useCallback((result: 'victory' | 'defeat') => {
    setScreen(result);
    setDragTypeId(null);
    setSelectedTowerId(null);
  }, []);

  const handleStartGame = () => {
    resumeAudio();
    setScreen('playing');
    setResetRequest((r) => r + 1);
    setStartWaveRequest(0);
    setSelectedTowerId(null);
    setDragTypeId(null);
  };

  const handleRestart = () => {
    setScreen('playing');
    setResetRequest((r) => r + 1);
    setStartWaveRequest(0);
    setSelectedTowerId(null);
    setDragTypeId(null);
  };

  const handleStartWave = () => {
    if (snapshot.waveStatus === 'waiting' || snapshot.waveStatus === 'between') {
      setStartWaveRequest((r) => r + 1);
    }
  };

  const togglePause = () => {
    setSnapshot((s) => ({ ...s, paused: !s.paused }));
  };

  const toggleSpeed = () => {
    setSnapshot((s) => ({
      ...s,
      gameSpeed: s.gameSpeed === 1 ? 2 : 1,
    }));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTowerId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const waveButtonLabel = useMemo(() => {
    if (snapshot.waveStatus === 'spawning' || snapshot.waveStatus === 'active') {
      return 'Wave In Progress';
    }
    if (snapshot.waveStatus === 'between') {
      return 'Next Wave Ready';
    }
    return `Start Wave ${snapshot.currentWave}`;
  }, [snapshot.waveStatus, snapshot.currentWave]);

  const canStartWave =
    snapshot.waveStatus === 'waiting' || snapshot.waveStatus === 'between';

  if (screen === 'home') {
    return (
      <div className="screen home-screen">
        <div className="home-content">
          <div className="home-badge">Strategy · Canvas · Waves</div>
          <h1>Tower Defense Simulator</h1>
          <p>
            Defend the exit from five escalating waves of enemies. Drag towers onto
            the map, upgrade your defenses, and stop the Final Boss from escaping.
          </p>
          <button type="button" className="btn btn-primary btn-large" onClick={handleStartGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'defeat') {
    return (
      <div className="screen overlay-screen defeat-screen">
        <div className="overlay-card">
          <h2>Defeat</h2>
          <p>Your base has been overrun. Regroup and try again.</p>
          <button type="button" className="btn btn-primary btn-large" onClick={handleRestart}>
            Restart
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'victory') {
    return (
      <div className="screen overlay-screen victory-screen">
        <div className="overlay-card">
          <h2>Victory</h2>
          <p>You defended all five waves and defeated the Final Boss!</p>
          <button type="button" className="btn btn-primary btn-large" onClick={handleRestart}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-layout">
      <header className="hud">
        <div className="hud-stat">
          <span className="hud-label">Health</span>
          <span className={`hud-value health ${snapshot.health <= 30 ? 'critical' : ''}`}>
            {snapshot.health}
          </span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Money</span>
          <span className="hud-value money">${snapshot.money}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Wave</span>
          <span className="hud-value">
            {snapshot.currentWave} / {TOTAL_WAVES}
          </span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Enemies</span>
          <span className="hud-value">{snapshot.enemiesRemaining}</span>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={togglePause}>
            {snapshot.paused ? 'Resume' : 'Pause'}
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={toggleSpeed}>
            {snapshot.gameSpeed}x Speed
          </button>
          <button
            type="button"
            className="btn btn-accent btn-small"
            onClick={handleStartWave}
            disabled={!canStartWave}
          >
            {waveButtonLabel}
          </button>
        </div>
      </header>

      <div className="wave-banner">{snapshot.waveMessage}</div>

      <div className="game-main">
        <aside className="tower-shop">
          <h3>Tower Shop</h3>
          <p className="shop-hint">Drag a tower onto the map</p>
          {TOWER_SHOP_ORDER.map((typeId) => {
            const type = TOWER_TYPES[typeId];
            const affordable = snapshot.money >= type.cost;
            return (
              <div
                key={typeId}
                className={`tower-card ${affordable ? '' : 'disabled'}`}
                onPointerDown={(e) => {
                  if (!affordable) return;
                  e.preventDefault();
                  setDragTypeId(typeId);
                }}
              >
                <div className="tower-card-header">
                  <span className="tower-icon" style={{ background: type.color }} />
                  <div>
                    <strong>{type.name}</strong>
                    <div className="tower-cost">${type.cost}</div>
                  </div>
                </div>
                <div className="tower-stats">
                  <span>DMG {type.damage}</span>
                  <span>RNG {type.range}</span>
                  <span>SPD {type.attackSpeed}/s</span>
                </div>
              </div>
            );
          })}
        </aside>

        <div className="canvas-wrap">
          <GameCanvas
            active
            onSnapshot={handleSnapshot}
            onGameOver={handleGameOver}
            onSelectTower={setSelectedTowerId}
            selectedTowerId={selectedTowerId}
            dragTypeId={dragTypeId}
            onDragEnd={() => setDragTypeId(null)}
            startWaveRequest={startWaveRequest}
            resetRequest={resetRequest}
            upgradeRequest={upgradeRequest}
            sellRequest={sellRequest}
            paused={snapshot.paused}
            gameSpeed={snapshot.gameSpeed}
          />
        </div>

        {snapshot.selectedTowerInfo && selectedTowerId !== null && (
          <UpgradePanel
            info={snapshot.selectedTowerInfo}
            money={snapshot.money}
            onClose={() => setSelectedTowerId(null)}
            onUpgrade={() => setUpgradeRequest((r) => r + 1)}
            onSell={() => {
              setSellRequest((r) => r + 1);
              setSelectedTowerId(null);
            }}
          />
        )}
      </div>

      <NotificationList notifications={snapshot.notifications} />
    </div>
  );
}

function UpgradePanel({
  info,
  money,
  onClose,
  onUpgrade,
  onSell,
}: {
  info: UpgradeInfo;
  money: number;
  onClose: () => void;
  onUpgrade: () => void;
  onSell: () => void;
}) {
  const canAffordUpgrade =
    info.canUpgrade && info.upgradeCost !== null && money >= info.upgradeCost;

  return (
    <aside className="upgrade-panel">
      <div className="upgrade-header">
        <h3>{info.name}</h3>
        <button type="button" className="btn btn-ghost btn-small" onClick={onClose}>
          Close
        </button>
      </div>
      <div className="upgrade-stats">
        <div>Level {info.tower.level} / 3</div>
        <div>Damage: {info.damage}</div>
        <div>Range: {info.range}</div>
        <div>Attack Speed: {info.attackSpeed.toFixed(2)}/s</div>
        <div>Total Spent: ${info.tower.totalSpent}</div>
      </div>
      <div className="upgrade-actions">
        {info.canUpgrade ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canAffordUpgrade}
            onClick={onUpgrade}
          >
            Upgrade (${info.upgradeCost})
          </button>
        ) : (
          <button type="button" className="btn btn-primary" disabled>
            Max Level
          </button>
        )}
        <button type="button" className="btn btn-danger" onClick={onSell}>
          Sell (${info.sellValue})
        </button>
      </div>
    </aside>
  );
}

function NotificationList({
  notifications,
}: {
  notifications: GameSnapshot['notifications'];
}) {
  if (!notifications.length) return null;
  return (
    <div className="notifications">
      {notifications.map((n) => (
        <div key={n.id} className={`notification ${n.type}`}>
          {n.message}
        </div>
      ))}
    </div>
  );
}
