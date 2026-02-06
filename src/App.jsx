import { useState, useCallback, useEffect } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import { useGame } from './hooks/useGame.js';
import { loadAppState, saveAppState } from './lib/storage.js';

export default function App() {
  const [screen, setScreen] = useState('home'); // 'home' | 'game'
  const [appState, setAppState] = useState(loadAppState);
  const { state: gameState, startLevel, toggleCell, fillCell, endDrag, toggleMode, undo, redo, useHint } = useGame();

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

  const handleGoHome = useCallback(() => {
    setScreen('home');
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextLevel = gameState.level + 1;
    startLevel(nextLevel);
  }, [gameState.level, startLevel]);

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

  if (screen === 'game') {
    return (
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
    );
  }

  return <HomeScreen appState={appState} onStartLevel={handleStartLevel} />;
}
