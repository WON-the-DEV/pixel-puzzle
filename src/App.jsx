import { useState, useCallback, useEffect } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import CollectionGameScreen from './components/CollectionGameScreen.jsx';
import TutorialScreen from './components/TutorialScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import { useGame } from './hooks/useGame.js';
import { loadAppState, saveAppState, loadCollectionProgress, saveCollectionProgress } from './lib/storage.js';
import { initAudio } from './lib/sound.js';
import { calculateStars } from './lib/puzzle.js';
import { loadSettings } from './lib/settings.js';

function hasSeenTutorial() {
  try {
    return localStorage.getItem('nonogram_tutorial_seen') === '1';
  } catch {
    return false;
  }
}

function markTutorialSeen() {
  try {
    localStorage.setItem('nonogram_tutorial_seen', '1');
  } catch {
    // ignore
  }
}

export default function App() {
  const [screen, setScreen] = useState(() => hasSeenTutorial() ? 'home' : 'tutorial');
  const [appState, setAppState] = useState(loadAppState);
  const [collectionProgress, setCollectionProgress] = useState(loadCollectionProgress);
  const [activeCollectionGame, setActiveCollectionGame] = useState(null); // { collectionId, tileRow, tileCol }
  const [homeTab, setHomeTab] = useState('puzzle'); // 'puzzle' | 'collection'
  const [homeScrollY, setHomeScrollY] = useState(0);
  const { state: gameState, startLevel, toggleCell, fillCell, endDrag, toggleMode, undo, redo, useHint, clearAutoX, restartLevel, revive } = useGame();

  // Apply dark mode on initial load
  useEffect(() => {
    const settings = loadSettings();
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', settings.darkMode ? '#1A1A2E' : '#ffffff');
    }
  }, []);

  // Init audio on first user interaction
  useEffect(() => {
    const handler = () => {
      initAudio();
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('click', handler);
    };
    document.addEventListener('touchstart', handler, { once: true });
    document.addEventListener('click', handler, { once: true });
    return () => {
      document.removeEventListener('touchstart', handler);
      document.removeEventListener('click', handler);
    };
  }, []);

  // Save app state when it changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Save collection progress when it changes
  useEffect(() => {
    saveCollectionProgress(collectionProgress);
  }, [collectionProgress]);

  // Handle level completion — update state + award hint
  useEffect(() => {
    if (gameState.isComplete && gameState.puzzle) {
      setAppState((prev) => {
        const completedLevels = prev.completedLevels.includes(gameState.level)
          ? prev.completedLevels
          : [...prev.completedLevels, gameState.level];
        const currentLevel = Math.max(prev.currentLevel, gameState.level + 1);
        const bestTimes = { ...prev.bestTimes };
        const prevBest = bestTimes[gameState.level];
        if (!prevBest || gameState.elapsedTime < prevBest) {
          bestTimes[gameState.level] = gameState.elapsedTime;
        }
        // 별점 기록
        const bestStars = { ...prev.bestStars };
        const stars = calculateStars(gameState.level, gameState.elapsedTime);
        const prevStars = bestStars[gameState.level];
        if (!prevStars || stars > prevStars) {
          bestStars[gameState.level] = stars;
        }
        // 힌트 보상: 레벨 완료 시 +1 (첫 완료만)
        const hints = prev.completedLevels.includes(gameState.level)
          ? prev.hints
          : prev.hints + 1;
        return { ...prev, completedLevels, currentLevel, bestTimes, bestStars, hints };
      });
    }
  }, [gameState.isComplete, gameState.level, gameState.elapsedTime, gameState.puzzle]);

  const handleStartLevel = useCallback(
    (level) => {
      startLevel(level);
      setScreen('game');
    },
    [startLevel]
  );

  const handleTutorialComplete = useCallback(() => {
    markTutorialSeen();
    setScreen('home');
  }, []);

  const handleGoHome = useCallback(() => {
    setScreen('home');
    setActiveCollectionGame(null);
    // 탭 유지: 컬렉션 게임에서 돌아올 때 컬렉션 탭 유지 (homeTab은 변경 안 함)
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextLevel = gameState.level + 1;
    startLevel(nextLevel);
  }, [gameState.level, startLevel]);

  const handleOpenSettings = useCallback(() => {
    setScreen('settings');
  }, []);

  const handleResetTutorial = useCallback(() => {
    setScreen('tutorial');
  }, []);

  const handleRestartLevel = useCallback(() => {
    restartLevel();
  }, [restartLevel]);

  const handleUseHint = useCallback(() => {
    if (appState.hints <= 0) return;
    setAppState((prev) => ({
      ...prev,
      hints: Math.max(0, prev.hints - 1),
    }));
    useHint();
  }, [appState.hints, useHint]);

  // 모든 퍼즐 해금 (버그 수정: App state를 직접 업데이트)
  const handleUnlockAll = useCallback(() => {
    setAppState((prev) => {
      const allLevels = Array.from({ length: 50 }, (_, i) => i + 1);
      return {
        ...prev,
        completedLevels: allLevels,
        currentLevel: 51,
      };
    });
    // 설정 화면에서 홈으로 돌아가기
    setScreen('home');
  }, []);

  // 광고 시청 (placeholder)
  const handleWatchAd = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      hints: prev.hints + 1,
    }));
    alert('광고 시청 완료! 힌트 +1 💡');
  }, []);

  // 힌트 구매 (placeholder)
  const handleBuyHints = useCallback(() => {
    setAppState((prev) => ({
      ...prev,
      hints: prev.hints + 5,
    }));
    alert('힌트 5개 구매 완료! 💎');
  }, []);

  // 컬렉션 타일 게임 시작
  const handleStartCollectionTile = useCallback((collectionId, tileRow, tileCol) => {
    setHomeTab('collection'); // 돌아올 때 컬렉션 탭 유지
    setActiveCollectionGame({ collectionId, tileRow, tileCol });
    setScreen('collection-game');
  }, []);

  // 컬렉션 타일 완료
  const handleCollectionTileComplete = useCallback((collectionId, tileRow, tileCol) => {
    setCollectionProgress((prev) => {
      const key = `${collectionId}-${tileRow}-${tileCol}`;
      if (prev.completedTiles.includes(key)) return prev;
      return {
        ...prev,
        completedTiles: [...prev.completedTiles, key],
      };
    });
    // 힌트 보상
    setAppState((prev) => ({
      ...prev,
      hints: prev.hints + 1,
    }));
  }, []);

  // Save on visibility change
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        saveAppState(appState);
        saveCollectionProgress(collectionProgress);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [appState, collectionProgress]);

  if (screen === 'tutorial') {
    return (
      <div className="screen-transition fade-in">
        <TutorialScreen onComplete={handleTutorialComplete} />
      </div>
    );
  }

  if (screen === 'settings') {
    return (
      <div className="screen-transition fade-in" key="settings">
        <SettingsScreen
          onGoHome={handleGoHome}
          onResetTutorial={handleResetTutorial}
          onUnlockAll={handleUnlockAll}
        />
      </div>
    );
  }

  if (screen === 'collection-game' && activeCollectionGame) {
    return (
      <div className="screen-transition fade-in" key={`cg-${activeCollectionGame.collectionId}-${activeCollectionGame.tileRow}-${activeCollectionGame.tileCol}`}>
        <CollectionGameScreen
          collectionId={activeCollectionGame.collectionId}
          tileRow={activeCollectionGame.tileRow}
          tileCol={activeCollectionGame.tileCol}
          onGoHome={handleGoHome}
          onComplete={handleCollectionTileComplete}
          hints={appState.hints}
          onUseHint={() => {
            if (appState.hints <= 0) return false;
            setAppState((prev) => ({
              ...prev,
              hints: Math.max(0, prev.hints - 1),
            }));
            return true;
          }}
        />
      </div>
    );
  }

  if (screen === 'game') {
    return (
      <div className="screen-transition fade-in" key={`game-${gameState.level}`}>
        <GameScreen
          gameState={gameState}
          onToggleCell={toggleCell}
          onFillCell={fillCell}
          onEndDrag={endDrag}
          onToggleMode={toggleMode}
          onUndo={undo}
          onRedo={redo}
          onUseHint={handleUseHint}
          onGoHome={handleGoHome}
          onNextLevel={handleNextLevel}
          onRestartLevel={handleRestartLevel}
          onRevive={revive}
          hints={appState.hints}
        />
      </div>
    );
  }

  return (
    <div className="screen-transition fade-in" key="home">
      <HomeScreen
        appState={appState}
        collectionProgress={collectionProgress}
        onStartLevel={handleStartLevel}
        onOpenSettings={handleOpenSettings}
        onWatchAd={handleWatchAd}
        onBuyHints={handleBuyHints}
        onStartCollectionTile={handleStartCollectionTile}
        activeTab={homeTab}
        onTabChange={setHomeTab}
        savedScrollY={homeScrollY}
        onScrollChange={setHomeScrollY}
      />
    </div>
  );
}
