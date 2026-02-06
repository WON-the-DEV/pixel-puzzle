import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './GameCanvas.jsx';
import CompleteModal from './CompleteModal.jsx';
import GameOverModal from './GameOverModal.jsx';
import { playFill, playMark, playLineComplete, playPuzzleComplete, playUndo, playHint, playLifeLost, playGameOver, playAutoX } from '../lib/sound.js';
import { hapticFill, hapticLineComplete, hapticPuzzleComplete, hapticLifeLost, hapticGameOver, hapticAutoX } from '../lib/haptic.js';
import { isRowComplete, isColComplete, calculateStars } from '../lib/puzzle.js';
import { BackIcon, HeartIcon, LightbulbIcon, UndoIcon, RedoIcon, PencilIcon, XMarkIcon } from './icons/Icons.jsx';

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
  onRestartLevel,
  hints,
}) {
  const { puzzle, playerGrid, mode, level, startTime, isComplete, elapsedTime, lives, maxLives, isGameOver, autoXCells, filledCorrect, lostLife, mistakeFlashCells } = gameState;
  const [displayTime, setDisplayTime] = useState('00:00');
  const timerRef = useRef(null);
  const prevCompleteRowsRef = useRef(new Set());
  const prevCompleteColsRef = useRef(new Set());
  const wasCompleteRef = useRef(false);
  const wasGameOverRef = useRef(false);

  // Timer
  useEffect(() => {
    if (isComplete || isGameOver) {
      if (isComplete) setDisplayTime(formatTime(elapsedTime));
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
  }, [startTime, isComplete, elapsedTime, isGameOver]);

  // Track life loss sound/haptic
  useEffect(() => {
    if (lostLife && !isGameOver) {
      playLifeLost();
      hapticLifeLost();
    }
  }, [lostLife, lives, isGameOver]);

  // Track game over sound/haptic
  useEffect(() => {
    if (isGameOver && !wasGameOverRef.current) {
      wasGameOverRef.current = true;
      playGameOver();
      hapticGameOver();
    }
  }, [isGameOver]);

  // Track auto X sound/haptic
  useEffect(() => {
    if (autoXCells && autoXCells.length > 0 && !isComplete) {
      playAutoX();
      hapticAutoX();
    }
  }, [autoXCells, isComplete]);

  // Track row/col completion for sound/haptic
  useEffect(() => {
    if (!puzzle || !playerGrid) return;

    if (isComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true;
      playPuzzleComplete();
      hapticPuzzleComplete();
      return;
    }

    const completeRows = new Set();
    const completeCols = new Set();
    for (let i = 0; i < puzzle.size; i++) {
      if (isRowComplete(puzzle.rowClues, playerGrid, i)) completeRows.add(i);
      if (isColComplete(puzzle.colClues, playerGrid, i)) completeCols.add(i);
    }

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
    wasGameOverRef.current = false;
  }, [level]);

  // Wrapped handlers with sound/haptic
  const handleToggleCell = useCallback((row, col) => {
    if (isComplete || isGameOver) return;
    if (mode === 'fill') {
      playFill();
    } else {
      playMark();
    }
    hapticFill();
    onToggleCell(row, col);
  }, [onToggleCell, mode, isComplete, isGameOver]);

  const handleUndo = useCallback(() => {
    playUndo();
    onUndo();
  }, [onUndo]);

  const handleUseHint = useCallback(() => {
    playHint();
    onUseHint();
  }, [onUseHint]);

  if (!puzzle) return null;

  const progressPercent = puzzle.totalFilled > 0 ? Math.round((filledCorrect / puzzle.totalFilled) * 100) : 0;
  const stars = isComplete ? calculateStars(level, elapsedTime) : 0;

  return (
    <div className="game-screen">
      {/* Header */}
      <header className="game-header">
        <button className="back-btn" onClick={onGoHome} aria-label="뒤로">
          <BackIcon size={24} />
        </button>
        <div className="level-info">
          <span className="level-number">
            Level {level}
            {puzzle.name && <span className="puzzle-name"> · {puzzle.name}</span>}
          </span>
          <span className="level-size">{puzzle.size}×{puzzle.size}</span>
        </div>
        <div className="header-right">
          <div className="lives-display">
            {Array.from({ length: maxLives }, (_, i) => (
              <span key={i} className={`life-heart ${i < lives ? 'active' : 'lost'}`}>
                <HeartIcon size={16} filled={i < lives} color={i < lives ? 'var(--danger)' : 'var(--text-tertiary)'} />
              </span>
            ))}
          </div>
          <div className="timer">{displayTime}</div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="progress-text">{filledCorrect}/{puzzle.totalFilled}</span>
      </div>

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
          autoXCells={autoXCells}
          mistakeFlashCells={mistakeFlashCells}
        />
      </main>

      {/* Controls */}
      <footer className="controls">
        <button className="control-btn" onClick={handleUseHint} disabled={hints <= 0 || isComplete || isGameOver}>
          <span className="icon">
            <LightbulbIcon size={24} color="var(--text)" />
          </span>
          <span className="label">힌트</span>
          {hints > 0 && <span className="count">{hints}</span>}
        </button>
        <button className="control-btn" onClick={handleUndo} disabled={isGameOver}>
          <span className="icon">
            <UndoIcon size={24} />
          </span>
          <span className="label">실행취소</span>
        </button>
        <button className="control-btn" onClick={onRedo} disabled={isGameOver}>
          <span className="icon">
            <RedoIcon size={24} />
          </span>
          <span className="label">다시실행</span>
        </button>
        <button
          className={`control-btn mode-toggle ${mode === 'fill' ? 'mode-fill' : 'mode-mark'}`}
          onClick={onToggleMode}
          disabled={isGameOver}
        >
          <div className="mode-toggle-inner">
            <div className={`mode-option ${mode === 'fill' ? 'active' : ''}`}>
              <span className="mode-icon">
                <PencilIcon size={18} color={mode === 'fill' ? 'var(--accent)' : 'var(--text-secondary)'} />
              </span>
              <span className="mode-label">색칠</span>
            </div>
            <div className={`mode-option ${mode === 'mark' ? 'active' : ''}`}>
              <span className="mode-icon">
                <XMarkIcon size={18} color={mode === 'mark' ? 'var(--danger)' : 'var(--text-secondary)'} />
              </span>
              <span className="mode-label">X표시</span>
            </div>
          </div>
        </button>
      </footer>

      {/* Complete Modal */}
      {isComplete && (
        <CompleteModal
          level={level}
          time={elapsedTime}
          puzzleName={puzzle.name}
          stars={stars}
          onHome={onGoHome}
          onNext={onNextLevel}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          level={level}
          onRestart={onRestartLevel}
          onHome={onGoHome}
        />
      )}
    </div>
  );
}
