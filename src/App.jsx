import { useState, useCallback, useEffect, useRef } from 'react';
import HomeScreen from './components/HomeScreen.jsx';
import GameScreen from './components/GameScreen.jsx';
import CollectionGameScreen from './components/CollectionGameScreen.jsx';
import TutorialScreen from './components/TutorialScreen.jsx';
import SettingsScreen from './components/SettingsScreen.jsx';
import StatsScreen from './components/StatsScreen.jsx';
import { ToastManager } from './components/Toast.jsx';
import { useGame } from './hooks/useGame.js';
import { loadAppState, saveAppState, loadCollectionProgress, saveCollectionProgress } from './lib/storage.js';
import { initAudio } from './lib/sound.js';
import { calculateStars, TOTAL_LEVELS, getSizeForLevel } from './lib/puzzle.js';
import { loadSettings } from './lib/settings.js';
import { TossSDK, canWatchAd } from './lib/tossSDK.js';
import { getDailyPuzzle, getTodayStr, loadDailyState, saveDailyState, calculateStreak, cleanupOldDailyData } from './lib/dailyChallenge.js';
import { checkAchievements, getAchievementById, incrementDarkModeCount } from './lib/achievements.js';

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
  const [darkMode, setDarkMode] = useState(() => loadSettings().darkMode);
  const [levelTransition, setLevelTransition] = useState(null); // 'slide-left-in' | null
  const [dailyDate, setDailyDate] = useState(null); // YYYY-MM-DD when playing daily
  const [toasts, setToasts] = useState([]); // toast queue
  const { state: gameState, startLevel, startDaily, toggleCell, fillCell, endDrag, toggleMode, useHint, clearAutoX, restartLevel, revive, applyZeroLineX } = useGame();
  // Track whether we already processed completion for current game instance
  const completionProcessedRef = useRef(false);

  // Remove splash screen on mount
  useEffect(() => {
    const splash = document.getElementById('splash');
    if (splash) splash.remove();
  }, []);

  // Cleanup old daily challenge data on startup (90 days)
  useEffect(() => {
    cleanupOldDailyData(90);
  }, []);

  // Apply dark mode on initial load
  useEffect(() => {
    const settings = loadSettings();
    setDarkMode(settings.darkMode);
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', settings.darkMode ? '#1A1A2E' : '#ffffff');
    }
  }, []);

  // Listen for dark mode changes via data-theme attribute
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      setDarkMode(isDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
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

  // Reset completion processed flag when starting a new game
  useEffect(() => {
    if (!gameState.isComplete) {
      completionProcessedRef.current = false;
    }
  }, [gameState.isComplete, gameState.level, dailyDate]);

  // Handle level completion — update state + award hint + stats + achievements
  useEffect(() => {
    if (gameState.isComplete && gameState.puzzle && !completionProcessedRef.current) {
      completionProcessedRef.current = true;

      // 다크 모드 완료 카운트 (일일/일반 모두)
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      if (isDark) {
        incrementDarkModeCount();
      }

      // 통계 업데이트
      updateStats(gameState.elapsedTime, gameState.lives === gameState.maxLives);

      // 일일 챌린지 완료 처리
      if (dailyDate) {
        saveDailyState(dailyDate, {
          completed: true,
          elapsedTime: gameState.elapsedTime,
          completedAt: Date.now(),
        });

        // 성취 체크 (일일 챌린지)
        const dailyStreak = calculateStreak();
        const achContext = {
          completedLevels: appState.completedLevels,
          bestStars: appState.bestStars,
          bestTimes: appState.bestTimes,
          collectionProgress,
          level: 0,
          lives: gameState.lives,
          maxLives: gameState.maxLives || 3,
          elapsedTime: gameState.elapsedTime,
          isDark,
          isDaily: true,
          puzzleSize: gameState.puzzle.size,
          dailyStreak,
        };
        const newAchievements = checkAchievements(achContext);
        showAchievementToasts(newAchievements);
        return;
      }

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

        const newState = { ...prev, completedLevels, currentLevel, bestTimes, bestStars, hints };

        // 성취 체크 (일반 레벨)
        const dailyStreak = calculateStreak();
        const achContext = {
          completedLevels: newState.completedLevels,
          bestStars: newState.bestStars,
          bestTimes: newState.bestTimes,
          collectionProgress,
          level: gameState.level,
          lives: gameState.lives,
          maxLives: gameState.maxLives || 3,
          elapsedTime: gameState.elapsedTime,
          isDark,
          isDaily: false,
          puzzleSize: gameState.puzzle.size,
          dailyStreak,
        };

        // setTimeout to avoid state update during render
        setTimeout(() => {
          const newAchievements = checkAchievements(achContext);
          showAchievementToasts(newAchievements);
        }, 100);

        return newState;
      });
    }
  }, [gameState.isComplete, gameState.level, gameState.elapsedTime, gameState.puzzle, dailyDate, gameState.lives, gameState.maxLives, collectionProgress]);

  // ─── 통계 업데이트 함수 ───
  const updateStats = useCallback((elapsedTime, isPerfect) => {
    try {
      const raw = localStorage.getItem('nonogram_stats');
      const stats = raw ? JSON.parse(raw) : {};
      stats.totalPlayTime = (stats.totalPlayTime || 0) + elapsedTime;
      if (isPerfect) {
        stats.perfectCount = (stats.perfectCount || 0) + 1;
      }
      localStorage.setItem('nonogram_stats', JSON.stringify(stats));
    } catch { /* ignore */ }
  }, []);

  // ─── 성취 토스트 표시 ───
  const showAchievementToasts = useCallback((achievementIds) => {
    if (!achievementIds || achievementIds.length === 0) return;
    const newToasts = achievementIds.map(id => {
      const ach = getAchievementById(id);
      return {
        icon: ach ? ach.icon : '🏆',
        message: ach ? `업적 달성! ${ach.name}` : '업적 달성!',
      };
    });
    setToasts(prev => [...prev, ...newToasts]);
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const handleStartLevel = useCallback(
    (level) => {
      startLevel(level);
      setDailyDate(null);
      setScreen('game');
    },
    [startLevel]
  );

  const handleStartDaily = useCallback(
    (dateStr) => {
      // 이미 완료된 퍼즐이면 무시
      const existingState = loadDailyState(dateStr);
      if (existingState && existingState.completed) return;

      const puzzle = getDailyPuzzle(dateStr);
      startDaily(puzzle, dateStr);
      setDailyDate(dateStr);
      setScreen('game');
    },
    [startDaily]
  );

  const handleTutorialComplete = useCallback(() => {
    markTutorialSeen();
    setScreen('home');
  }, []);

  const handleGoHome = useCallback(() => {
    setScreen('home');
    setActiveCollectionGame(null);
    setDailyDate(null);
    // 탭 유지: 컬렉션 게임에서 돌아올 때 컬렉션 탭 유지 (homeTab은 변경 안 함)
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextLevel = gameState.level + 1;
    setLevelTransition('slide-left-in');
    startLevel(nextLevel);
    // Clear transition class after animation completes
    setTimeout(() => setLevelTransition(null), 450);
  }, [gameState.level, startLevel]);

  const handleOpenSettings = useCallback(() => {
    setScreen('settings');
  }, []);

  const handleOpenStats = useCallback(() => {
    setScreen('stats');
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
      const allLevels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);
      return {
        ...prev,
        completedLevels: allLevels,
        currentLevel: TOTAL_LEVELS + 1,
      };
    });
    // 설정 화면에서 홈으로 돌아가기
    setScreen('home');
  }, []);

  // 광고 시청 (TossSDK 연동)
  const handleWatchAd = useCallback(async () => {
    if (!canWatchAd()) {
      setToasts(prev => [...prev, { icon: '⏰', message: '오늘의 광고 시청 횟수를 모두 사용했어요' }]);
      return;
    }
    const result = await TossSDK.showRewardedAd();
    if (result.rewarded) {
      setAppState((prev) => ({
        ...prev,
        hints: prev.hints + 1,
      }));
      setToasts(prev => [...prev, { icon: '💡', message: '광고 시청 완료! 힌트 +1' }]);
    }
  }, []);

  // 힌트 구매 (TossSDK 연동)
  const handleBuyHints = useCallback(async () => {
    const result = await TossSDK.purchase('hints_5');
    if (result.success) {
      setAppState((prev) => ({
        ...prev,
        hints: prev.hints + 5,
      }));
      setToasts(prev => [...prev, { icon: '💎', message: '힌트 5개 구매 완료!' }]);
    }
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
      const newProgress = {
        ...prev,
        completedTiles: [...prev.completedTiles, key],
      };

      // 성취 체크 (컬렉션) — use setAppState to read current values without stale closure
      setTimeout(() => {
        setAppState((currentAppState) => {
          const dailyStreak = calculateStreak();
          const achContext = {
            completedLevels: currentAppState.completedLevels,
            bestStars: currentAppState.bestStars,
            bestTimes: currentAppState.bestTimes,
            collectionProgress: newProgress,
            level: 0,
            lives: 3,
            maxLives: 3,
            elapsedTime: 0,
            isDark: document.documentElement.getAttribute('data-theme') === 'dark',
            isDaily: false,
            puzzleSize: 5,
            dailyStreak,
          };
          const newAchievements = checkAchievements(achContext);
          showAchievementToasts(newAchievements);
          return currentAppState; // no change to state
        });
      }, 100);

      return newProgress;
    });
    // 힌트 보상
    setAppState((prev) => ({
      ...prev,
      hints: prev.hints + 1,
    }));
  }, [showAchievementToasts]);

  // Auto-save daily game progress
  useEffect(() => {
    if (!dailyDate || !gameState.puzzle || gameState.isComplete || gameState.isGameOver) return;
    if (gameState.playerGrid && gameState.playerGrid.length > 0) {
      const key = 'nonogram_daily_game_' + dailyDate;
      try {
        localStorage.setItem(key, JSON.stringify({
          playerGrid: gameState.playerGrid,
          mode: gameState.mode,
          lives: gameState.lives,
          elapsedTime: gameState.startTime ? Date.now() - gameState.startTime : 0,
          usedRevive: gameState.usedRevive,
          filledCorrect: gameState.filledCorrect,
          totalFilled: gameState.puzzle.totalFilled,
        }));
      } catch { /* ignore */ }
    }
  }, [dailyDate, gameState.playerGrid, gameState.isComplete, gameState.isGameOver]);

  // Also save daily progress for the DailyChallenge card display
  useEffect(() => {
    if (!dailyDate || !gameState.puzzle || gameState.isComplete) return;
    saveDailyState(dailyDate, {
      completed: false,
      filledCorrect: gameState.filledCorrect || 0,
      totalFilled: gameState.puzzle.totalFilled || 1,
    });
  }, [dailyDate, gameState.filledCorrect, gameState.isComplete]);

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
        <ToastManager toasts={toasts} onClear={clearToasts} />
        <SettingsScreen
          onGoHome={handleGoHome}
          onResetTutorial={handleResetTutorial}
          onUnlockAll={handleUnlockAll}
          onOpenStats={handleOpenStats}
        />
      </div>
    );
  }

  if (screen === 'stats') {
    return (
      <div className="screen-transition fade-in" key="stats">
        <ToastManager toasts={toasts} onClear={clearToasts} />
        <StatsScreen
          appState={appState}
          collectionProgress={collectionProgress}
          onGoBack={() => setScreen('settings')}
        />
      </div>
    );
  }

  if (screen === 'collection-game' && activeCollectionGame) {
    return (
      <div className="screen-transition fade-in" key={`cg-${activeCollectionGame.collectionId}-${activeCollectionGame.tileRow}-${activeCollectionGame.tileCol}`}>
        <ToastManager toasts={toasts} onClear={clearToasts} />
        <CollectionGameScreen
          collectionId={activeCollectionGame.collectionId}
          tileRow={activeCollectionGame.tileRow}
          tileCol={activeCollectionGame.tileCol}
          onGoHome={handleGoHome}
          onComplete={handleCollectionTileComplete}
          hints={appState.hints}
          darkMode={darkMode}
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
      <div className={`screen-transition ${levelTransition || 'fade-in'}`} key={`game-${gameState.level}`}>
        <ToastManager toasts={toasts} onClear={clearToasts} />
        <GameScreen
          gameState={gameState}
          onToggleCell={toggleCell}
          onFillCell={fillCell}
          onEndDrag={endDrag}
          onToggleMode={toggleMode}
          onUseHint={handleUseHint}
          onGoHome={handleGoHome}
          onNextLevel={handleNextLevel}
          onRestartLevel={handleRestartLevel}
          onRevive={revive}
          onApplyZeroLineX={applyZeroLineX}
          hints={appState.hints}
          darkMode={darkMode}
          isDaily={!!dailyDate}
          dailyDate={dailyDate}
        />
      </div>
    );
  }

  return (
    <div className="screen-transition fade-in" key="home">
      <ToastManager toasts={toasts} onClear={clearToasts} />
      <HomeScreen
        appState={appState}
        collectionProgress={collectionProgress}
        onStartLevel={handleStartLevel}
        onOpenSettings={handleOpenSettings}
        onWatchAd={handleWatchAd}
        onBuyHints={handleBuyHints}
        onStartCollectionTile={handleStartCollectionTile}
        onStartDaily={handleStartDaily}
        activeTab={homeTab}
        onTabChange={setHomeTab}
        savedScrollY={homeScrollY}
        onScrollChange={setHomeScrollY}
      />
    </div>
  );
}
