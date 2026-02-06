import { useState, useCallback, useEffect } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import TutorialScreen from './components/TutorialScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import { useGame } from './hooks/useGame.js';
import { loadAppState, saveAppState } from './lib/storage.js';
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
  const { state: gameState, startLevel, toggleCell, fillCell, endDrag, toggleMode, undo, redo, useHint, clearAutoX, restartLevel } = useGame();

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

  // 광고 시청 (placeholder)
  const handleWatchAd = useCallback(() => {
    // TODO: 실제 광고 SDK 연동
    setAppState((prev) => ({
      ...prev,
      hints: prev.hints + 1,
    }));
    alert('광고 시청 완료! 힌트 +1 💡');
  }, []);

  // 힌트 구매 (placeholder)
  const handleBuyHints = useCallback(() => {
    // TODO: 실제 인앱 결제 연동
    setAppState((prev) => ({
      ...prev,
      hints: prev.hints + 5,
    }));
    alert('힌트 5개 구매 완료! 💎');
  }, []);

  // Save on visibility change
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        saveAppState(appState);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [appState]);

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
        <SettingsScreen onGoHome={handleGoHome} onResetTutorial={handleResetTutorial} />
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
          hints={appState.hints}
        />
      </div>
    );
  }

  return (
    <div className="screen-transition fade-in" key="home">
      <HomeScreen
        appState={appState}
        onStartLevel={handleStartLevel}
        onOpenSettings={handleOpenSettings}
        onWatchAd={handleWatchAd}
        onBuyHints={handleBuyHints}
      />
    </div>
  );
}
