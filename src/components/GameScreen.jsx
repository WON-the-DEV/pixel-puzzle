import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './GameCanvas.jsx';
import CompleteModal from './CompleteModal.jsx';

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function GameScreen({
  gameState,
  onToggleCell,
  onFillCell,
  onEndDrag,
  onToggleMode,
  onUndo,
  onRedo,
  onUseHint,
  onGoHome,
  onNextLevel,
}) {
  const { puzzle, playerGrid, mode, hints, level, startTime, isComplete, elapsedTime } = gameState;
  const [displayTime, setDisplayTime] = useState('00:00');
  const timerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (isComplete) {
      setDisplayTime(formatTime(elapsedTime));
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (!startTime) return;

    const tick = () => {
      setDisplayTime(formatTime(Date.now() - startTime));
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startTime, isComplete, elapsedTime]);

  if (!puzzle) return null;

  return (
    <div className="game-screen">
      {/* Header */}
      <header className="game-header">
        <button className="back-btn" onClick={onGoHome} aria-label="뒤로">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="level-info">
          <span className="level-number">
            Level {level}
            {puzzle.name && <span className="puzzle-name"> · {puzzle.name}</span>}
          </span>
          <span className="level-size">{puzzle.size}×{puzzle.size}</span>
        </div>
        <div className="timer">{displayTime}</div>
      </header>

      {/* Canvas */}
      <main className="game-container">
        <GameCanvas
          puzzle={puzzle}
          playerGrid={playerGrid}
          mode={mode}
          onToggleCell={onToggleCell}
          onFillCell={onFillCell}
          onEndDrag={onEndDrag}
          isComplete={isComplete}
        />
      </main>

      {/* Controls */}
      <footer className="controls">
        <button className="control-btn" onClick={onUseHint} disabled={hints <= 0 || isComplete}>
          <span className="icon">💡</span>
          <span className="label">힌트</span>
          {hints > 0 && <span className="count">{hints}</span>}
        </button>
        <button className="control-btn" onClick={onUndo}>
          <span className="icon">↩️</span>
          <span className="label">실행취소</span>
        </button>
        <button className="control-btn" onClick={onRedo}>
          <span className="icon">↪️</span>
          <span className="label">다시실행</span>
        </button>
        <button
          className={`control-btn ${mode === 'mark' ? 'active-mode' : ''}`}
          onClick={onToggleMode}
        >
          <span className="icon">{mode === 'fill' ? '✏️' : '❌'}</span>
          <span className="label">{mode === 'fill' ? '색칠' : 'X표시'}</span>
        </button>
      </footer>

      {/* Complete Modal */}
      {isComplete && (
        <CompleteModal
          level={level}
          time={elapsedTime}
          puzzleName={puzzle.name}
          onHome={onGoHome}
          onNext={onNextLevel}
        />
      )}
    </div>
  );
}
