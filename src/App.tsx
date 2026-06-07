import { useCallback, useEffect, useMemo, useState } from 'react';
import { GameCanvas } from './game/GameCanvas';
import type { GameSnapshot, ScreenState } from './game/gameTypes';
import { TOWER_SHOP_ORDER, TOWER_TYPES } from './game/constants';
import { DEFAULT_MAP_ID, MAP_LIST } from './game/maps';
import { resumeAudio } from './game/audio';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('home');
  const [selectedMapId, setSelectedMapId] = useState(DEFAULT_MAP_ID);
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
  const [autoStartWaves, setAutoStartWaves] = useState(false);
  const [resetPreserveAutoStart, setResetPreserveAutoStart] = useState(false);
  const [snapshot, setSnapshot] = useState<GameSnapshot>({
    money: 500,
    health: 100,
    currentWave: 1,
    totalWaves: 5,
    mapName: '',
    waveStatus: 'waiting',
    waveMessage: 'Place towers, then start the wave',
    paused: false,
    gameSpeed: 1,
    autoStartWaves: false,
    selectedTowerInfo: null,
    notifications: [],
  });
  const [selectedTowerId, setSelectedTowerId] = useState<number | null>(null);
  const [dragTypeId, setDragTypeId] = useState<string | null>(null);
  const [startWaveRequest, setStartWaveRequest] = useState(0);
  const [resetRequest, setResetRequest] = useState(0);
  const [upgradeRequest, setUpgradeRequest] = useState(0);
  const [sellRequest, setSellRequest] = useState<{ towerId: number; nonce: number } | null>(
    null,
  );

  const handleSnapshot = useCallback((next: GameSnapshot) => {
    setSnapshot(next);
  }, []);

  const handleGameOver = useCallback((result: 'victory' | 'defeat') => {
    setScreen(result);
    setPauseMenuOpen(false);
    setDragTypeId(null);
    setSelectedTowerId(null);
    setSnapshot((s) => ({ ...s, paused: false }));
  }, []);

  const triggerReset = (preserveAutoStart: boolean) => {
    setResetPreserveAutoStart(preserveAutoStart);
    setResetRequest((r) => r + 1);
  };

  const handleStartGame = (mapId: string) => {
    resumeAudio();
    setSelectedMapId(mapId);
    setAutoStartWaves(false);
    setScreen('playing');
    setPauseMenuOpen(false);
    triggerReset(false);
    setStartWaveRequest(0);
    setSelectedTowerId(null);
    setDragTypeId(null);
    setSnapshot((s) => ({
      ...s,
      paused: false,
      autoStartWaves: false,
    }));
  };

  const handleRestart = () => {
    setScreen('playing');
    setPauseMenuOpen(false);
    triggerReset(true);
    setStartWaveRequest(0);
    setSelectedTowerId(null);
    setDragTypeId(null);
    setSnapshot((s) => ({ ...s, paused: false }));
  };

  const handleGoHome = () => {
    setScreen('home');
    setPauseMenuOpen(false);
    setAutoStartWaves(false);
    triggerReset(false);
    setStartWaveRequest(0);
    setSelectedTowerId(null);
    setDragTypeId(null);
    setSnapshot((s) => ({
      ...s,
      paused: false,
      autoStartWaves: false,
    }));
  };

  const openPauseMenu = () => {
    setPauseMenuOpen(true);
    setSnapshot((s) => ({ ...s, paused: true }));
  };

  const resumeFromPause = () => {
    setPauseMenuOpen(false);
    setSnapshot((s) => ({ ...s, paused: false }));
  };

  const handleRestartFromPause = () => {
    setPauseMenuOpen(false);
    handleRestart();
  };

  const handleStartWave = () => {
    if (snapshot.waveStatus === 'waiting' || snapshot.waveStatus === 'between') {
      setStartWaveRequest((r) => r + 1);
    }
  };

  const toggleSpeed = () => {
    setSnapshot((s) => ({
      ...s,
      gameSpeed: s.gameSpeed === 1 ? 2 : 1,
    }));
  };

  const toggleAutoStartWaves = () => {
    setAutoStartWaves((value) => !value);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen !== 'playing') return;
      if (e.key === 'Escape') {
        if (pauseMenuOpen) {
          resumeFromPause();
        } else if (selectedTowerId !== null) {
          setSelectedTowerId(null);
        } else {
          openPauseMenu();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen, pauseMenuOpen, selectedTowerId]);

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
            Choose a battlefield and defend the exit from five escalating waves.
            Drag towers onto the map, upgrade your defenses, and stop the Final Boss.
          </p>
          <div className="map-grid">
            {MAP_LIST.map((map) => (
              <button
                key={map.id}
                type="button"
                className="map-card"
                onClick={() => handleStartGame(map.id)}
              >
                <span className={`map-difficulty map-difficulty-${map.difficulty.toLowerCase()}`}>
                  {map.difficulty}
                </span>
                <strong className="map-name">{map.name}</strong>
                <span className="map-description">{map.description}</span>
              </button>
            ))}
          </div>
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
          <div className="overlay-actions">
            <button type="button" className="btn btn-primary btn-large" onClick={handleRestart}>
              Restart
            </button>
            <button type="button" className="btn btn-secondary btn-large" onClick={handleGoHome}>
              Home
            </button>
          </div>
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
          <div className="overlay-actions">
            <button type="button" className="btn btn-primary btn-large" onClick={handleRestart}>
              Play Again
            </button>
            <button type="button" className="btn btn-secondary btn-large" onClick={handleGoHome}>
              Home
            </button>
          </div>
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
          <span className="hud-label">Map</span>
          <span className="hud-value">{snapshot.mapName}</span>
        </div>
        <div className="hud-stat">
          <span className="hud-label">Wave</span>
          <span className="hud-value">
            {snapshot.currentWave} / {snapshot.totalWaves}
          </span>
        </div>
        <div className="hud-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={openPauseMenu}>
            Pause
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={toggleSpeed}>
            {snapshot.gameSpeed}x Speed
          </button>
          <button
            type="button"
            className="btn btn-accent btn-small"
            onClick={handleStartWave}
            disabled={!canStartWave || (autoStartWaves && snapshot.waveStatus === 'between')}
          >
            {autoStartWaves && snapshot.waveStatus === 'between'
              ? 'Auto-Starting...'
              : waveButtonLabel}
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
                  if (!affordable || pauseMenuOpen) return;
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
            mapId={selectedMapId}
            active
            onSnapshot={handleSnapshot}
            onGameOver={handleGameOver}
            onSelectTower={setSelectedTowerId}
            selectedTowerId={selectedTowerId}
            dragTypeId={dragTypeId}
            onDragEnd={() => setDragTypeId(null)}
            startWaveRequest={startWaveRequest}
            resetRequest={resetRequest}
            resetPreserveAutoStart={resetPreserveAutoStart}
            upgradeRequest={upgradeRequest}
            sellRequest={sellRequest}
            paused={snapshot.paused}
            gameSpeed={snapshot.gameSpeed}
            autoStartWaves={autoStartWaves}
          />
        </div>

        {snapshot.selectedTowerInfo && selectedTowerId !== null && !pauseMenuOpen && (
          <UpgradePanel
            info={snapshot.selectedTowerInfo}
            money={snapshot.money}
            onClose={() => setSelectedTowerId(null)}
            onUpgrade={() => setUpgradeRequest((r) => r + 1)}
            onSell={() => {
              if (selectedTowerId === null) return;
              setSellRequest({ towerId: selectedTowerId, nonce: Date.now() });
              setSelectedTowerId(null);
            }}
          />
        )}
      </div>

      {pauseMenuOpen && (
        <PauseMenu
          autoStartWaves={autoStartWaves}
          onResume={resumeFromPause}
          onRestart={handleRestartFromPause}
          onHome={handleGoHome}
          onToggleAutoStart={toggleAutoStartWaves}
        />
      )}

      <NotificationList notifications={snapshot.notifications} />
    </div>
  );
}

function PauseMenu({
  autoStartWaves,
  onResume,
  onRestart,
  onHome,
  onToggleAutoStart,
}: {
  autoStartWaves: boolean;
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onToggleAutoStart: () => void;
}) {
  return (
    <div className="pause-overlay">
      <div className="pause-menu">
        <h2>Paused</h2>
        <label className="pause-toggle">
          <input
            type="checkbox"
            checked={autoStartWaves}
            onChange={onToggleAutoStart}
          />
          <span>Auto-Start Waves</span>
        </label>
        <p className="pause-hint">
          {autoStartWaves
            ? 'Next waves begin automatically after each wave ends.'
            : 'Waves must be started manually from the HUD.'}
        </p>
        <div className="pause-actions">
          <button type="button" className="btn btn-primary" onClick={onResume}>
            Resume
          </button>
          <button type="button" className="btn btn-secondary" onClick={onRestart}>
            Restart
          </button>
          <button type="button" className="btn btn-ghost" onClick={onHome}>
            Home
          </button>
        </div>
      </div>
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
  info: NonNullable<GameSnapshot['selectedTowerInfo']>;
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
