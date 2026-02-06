import { useState, useCallback, useEffect } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import TutorialScreen from './components/TutorialScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import { useGame } from './hooks/useGame.js';
import { loadAppState, saveAppState } from './lib/storage.js';
import { initAudio } from './lib/sound.js';

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
  const [screen, setScreen] = useState(() => hasSeenTutorial() ? 'home' : 'tutorial'); // 'tutorial' | 'home' | 'game' | 'settings'
  const [appState, setAppState] = useState(loadAppState);
  const { state: gameState, startLevel, toggleCell, fillCell, endDrag, toggleMode, undo, redo, useHint } = useGame();

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

  // Handle level completion
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
        return { ...prev, completedLevels, currentLevel, bestTimes };
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
          onUseHint={useHint}
          onGoHome={handleGoHome}
          onNextLevel={handleNextLevel}
        />
      </div>
    );
  }

  return (
    <div className="screen-transition fade-in" key="home">
      <HomeScreen appState={appState} onStartLevel={handleStartLevel} onOpenSettings={handleOpenSettings} />
    </div>
  );
}
