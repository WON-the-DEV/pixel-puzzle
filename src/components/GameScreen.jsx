import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './GameCanvas.jsx';
import CompleteModal from './CompleteModal.jsx';
import { playFill, playMark, playLineComplete, playPuzzleComplete, playUndo, playHint } from '../lib/sound.js';
import { hapticFill, hapticLineComplete, hapticPuzzleComplete } from '../lib/haptic.js';
import { isRowComplete, isColComplete } from '../lib/puzzle.js';
import { loadSettings } from '../lib/settings.js';

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
  const prevCompleteRowsRef = useRef(new Set());
  const prevCompleteColsRef = useRef(new Set());
  const wasCompleteRef = useRef(false);
  const settings = loadSettings();

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

  // Track row/col completion for sound/haptic
  useEffect(() => {
    if (!puzzle || !playerGrid) return;

    // Check puzzle complete
    if (isComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true;
      playPuzzleComplete();
      hapticPuzzleComplete();
      return;
    }

    // Check row/col completions
    const completeRows = new Set();
    const completeCols = new Set();
    for (let i = 0; i < puzzle.size; i++) {
      if (isRowComplete(puzzle.rowClues, playerGrid, i)) completeRows.add(i);
      if (isColComplete(puzzle.colClues, playerGrid, i)) completeCols.add(i);
    }

    // Find newly completed
    let newlyCompleted = false;
    for (const r of completeRows) {
      if (!prevCompleteRowsRef.current.has(r)) {
        newlyCompleted = true;
        break;
      }
    }
    if (!newlyCompleted) {
      for (const c of completeCols) {
        if (!prevCompleteColsRef.current.has(c)) {
          newlyCompleted = true;
          break;
        }
      }
    }

    if (newlyCompleted && !isComplete) {
      playLineComplete();
      hapticLineComplete();
    }

    prevCompleteRowsRef.current = completeRows;
    prevCompleteColsRef.current = completeCols;
  }, [puzzle, playerGrid, isComplete]);

  // Reset refs on level change
  useEffect(() => {
    prevCompleteRowsRef.current = new Set();
    prevCompleteColsRef.current = new Set();
    wasCompleteRef.current = false;
  }, [level]);

  // Wrapped handlers with sound/haptic
  const handleToggleCell = useCallback((row, col) => {
    if (isComplete) return;
    const current = playerGrid[row][col];
    if (mode === 'fill') {
      playFill();
    } else {
      playMark();
    }
    hapticFill();
    onToggleCell(row, col);
  }, [onToggleCell, playerGrid, mode, isComplete]);

  const handleUndo = useCallback(() => {
    playUndo();
    onUndo();
  }, [onUndo]);

  const handleUseHint = useCallback(() => {
    playHint();
    onUseHint();
  }, [onUseHint]);

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
          onToggleCell={handleToggleCell}
          onFillCell={onFillCell}
          onEndDrag={onEndDrag}
          isComplete={isComplete}
          showMistakes={settings.showMistakes}
        />
      </main>

      {/* Controls */}
      <footer className="controls">
        <button className="control-btn" onClick={handleUseHint} disabled={hints <= 0 || isComplete}>
          <span className="icon">💡</span>
          <span className="label">힌트</span>
          {hints > 0 && <span className="count">{hints}</span>}
        </button>
        <button className="control-btn" onClick={handleUndo}>
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
