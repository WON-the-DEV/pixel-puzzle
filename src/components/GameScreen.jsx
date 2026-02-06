import { useState, useEffect, useRef, useCallback } from 'react';
import GameCanvas from './GameCanvas.jsx';
import CompleteModal from './CompleteModal.jsx';
import GameOverModal from './GameOverModal.jsx';
import ControllerPad from './ControllerPad.jsx';
import { playFill, playMark, playLineComplete, playPuzzleComplete, playUndo, playHint, playLifeLost, playGameOver, playAutoX } from '../lib/sound.js';
import { hapticFill, hapticLineComplete, hapticPuzzleComplete, hapticLifeLost, hapticGameOver, hapticAutoX } from '../lib/haptic.js';
import { isRowComplete, isColComplete, calculateStars } from '../lib/puzzle.js';
import { BackIcon, HeartIcon, LightbulbIcon, PencilIcon, XMarkIcon, TouchIcon, ControllerIcon } from './icons/Icons.jsx';

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
  onUseHint,
  onGoHome,
  onNextLevel,
  onRestartLevel,
  onRevive,
  hints,
  darkMode = false,
  isDaily = false,
  dailyDate = null,
}) {
  const { puzzle, playerGrid, mode, level, startTime, isComplete, elapsedTime, lives, maxLives, isGameOver, autoXCells, filledCorrect, lostLife, mistakeFlashCells, usedRevive } = gameState;
  const [displayTime, setDisplayTime] = useState('00:00');
  const timerRef = useRef(null);
  const prevCompleteRowsRef = useRef(new Set());
  const prevCompleteColsRef = useRef(new Set());
  const wasCompleteRef = useRef(false);
  const wasGameOverRef = useRef(false);

  // Controller mode
  const [controllerMode, setControllerMode] = useState(false);
  const [cursorRow, setCursorRow] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);

  // Reset cursor when level changes
  useEffect(() => {
    setCursorRow(0);
    setCursorCol(0);
  }, [level]);

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
    if (!isGameOver && wasGameOverRef.current) {
      wasGameOverRef.current = false;
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

  const handleUseHint = useCallback(() => {
    playHint();
    onUseHint();
  }, [onUseHint]);

  // Controller mode handlers
  // Bug 5 fix: Use onFillCell directly instead of toggling mode + onToggleCell
  // This avoids the stale mode issue where React batches the mode toggle and cell toggle
  const handleControllerFill = useCallback(() => {
    if (isComplete || isGameOver || !puzzle) return;
    const current = playerGrid[cursorRow]?.[cursorCol];
    if (current === undefined) return;
    
    playFill();
    hapticFill();
    
    // If already filled, unfill (toggle off)
    if (current === 1) {
      // Need fill mode to unfill
      if (mode !== 'fill') onToggleMode();
      onToggleCell(cursorRow, cursorCol);
    } else if (current === 2) {
      // Already X-marked, skip
      return;
    } else {
      // Empty cell - fill it directly using fill mode
      if (mode !== 'fill') onToggleMode();
      onToggleCell(cursorRow, cursorCol);
    }
  }, [cursorRow, cursorCol, isComplete, isGameOver, puzzle, mode, onToggleMode, onToggleCell, playerGrid]);

  const handleControllerMark = useCallback(() => {
    if (isComplete || isGameOver || !puzzle) return;
    const current = playerGrid[cursorRow]?.[cursorCol];
    if (current === undefined) return;
    
    playMark();
    hapticFill();
    
    if (current === 1) {
      // Already filled, skip
      return;
    } else {
      // Toggle X mark
      if (mode !== 'mark') onToggleMode();
      onToggleCell(cursorRow, cursorCol);
    }
  }, [cursorRow, cursorCol, isComplete, isGameOver, puzzle, mode, onToggleMode, onToggleCell, playerGrid]);

  // Bug 4: handleControllerMove now accepts holdAction for continuous fill/mark
  const handleControllerMove = useCallback((direction, holdAction) => {
    if (!puzzle) return;
    
    let newRow = cursorRow;
    let newCol = cursorCol;
    
    if (direction === 'up') newRow = Math.max(0, cursorRow - 1);
    if (direction === 'down') newRow = Math.min(puzzle.size - 1, cursorRow + 1);
    if (direction === 'left') newCol = Math.max(0, cursorCol - 1);
    if (direction === 'right') newCol = Math.min(puzzle.size - 1, cursorCol + 1);
    
    setCursorRow(newRow);
    setCursorCol(newCol);
    hapticFill();
    
    // If holding fill/mark button while moving, auto-apply action
    if (holdAction && !isComplete && !isGameOver) {
      const current = playerGrid[newRow]?.[newCol];
      if (current === undefined) return;
      
      if (holdAction === 'fill') {
        if (current === 0) {
          // Empty cell - fill it
          playFill();
          if (mode !== 'fill') onToggleMode();
          // Use setTimeout to ensure mode change is processed
          setTimeout(() => onToggleCell(newRow, newCol), 0);
        }
      } else if (holdAction === 'mark') {
        if (current === 0) {
          // Empty cell - mark it
          playMark();
          if (mode !== 'mark') onToggleMode();
          setTimeout(() => onToggleCell(newRow, newCol), 0);
        }
      }
    }
  }, [puzzle, cursorRow, cursorCol, isComplete, isGameOver, playerGrid, mode, onToggleMode, onToggleCell]);

  if (!puzzle) return null;

  const progressPercent = puzzle.totalFilled > 0 ? Math.round((filledCorrect / puzzle.totalFilled) * 100) : 0;
  const stars = isComplete ? calculateStars(level, elapsedTime) : 0;

  return (
    <div className={`game-screen ${controllerMode ? 'controller-active' : ''}`}>
      {/* Header */}
      <header className={`game-header ${controllerMode ? 'game-header--compact' : ''}`}>
        <button className="back-btn" onClick={onGoHome} aria-label="뒤로">
          <BackIcon size={controllerMode ? 20 : 24} />
        </button>
        <div className="level-info">
          {isDaily ? (
            <span className="level-number daily-game-title">
              📅 오늘의 퍼즐
              {dailyDate && <span className="daily-game-date">{dailyDate}</span>}
            </span>
          ) : (
            <span className="level-number">
              Level {level}
              {puzzle.name && <span className="puzzle-name"> · {puzzle.name}</span>}
            </span>
          )}
          {!controllerMode && !isDaily && <span className="level-size">{puzzle.size}×{puzzle.size}</span>}
        </div>
        <div className="header-right">
          <div className="lives-display">
            {Array.from({ length: maxLives }, (_, i) => (
              <span key={i} className={`life-heart ${i < lives ? 'active' : 'lost'}`}>
                <HeartIcon size={controllerMode ? 14 : 16} filled={i < lives} color={i < lives ? 'var(--danger)' : 'var(--text-tertiary)'} />
              </span>
            ))}
          </div>
          {controllerMode ? (
            <div className="timer timer--compact">{displayTime}</div>
          ) : (
            <div className="timer">{displayTime}</div>
          )}
        </div>
      </header>

      {/* Progress bar — hidden in controller mode */}
      {!controllerMode && (
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="progress-text">{filledCorrect}/{puzzle.totalFilled}</span>
        </div>
      )}

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
          controllerMode={controllerMode}
          cursorRow={cursorRow}
          cursorCol={cursorCol}
          darkMode={darkMode}
        />
      </main>

      {/* Controls */}
      {controllerMode ? (
        <footer className="controls controller-controls">
          {/* Bug 1: Hint + Touch buttons moved to a utility bar above the controller */}
          <div className="controller-utility-bar">
            <button className="control-btn-sm" onClick={handleUseHint} disabled={hints <= 0 || isComplete || isGameOver}>
              <LightbulbIcon size={16} color="var(--text)" />
              <span>힌트</span>
              {hints > 0 && <span className="count-sm">{hints}</span>}
            </button>
            <button
              className="control-btn-sm"
              onClick={() => setControllerMode(false)}
              aria-label="터치 모드로 전환"
            >
              <TouchIcon size={16} color="var(--text)" />
              <span>터치</span>
            </button>
          </div>
          <ControllerPad
            onMove={handleControllerMove}
            onFill={handleControllerFill}
            onMark={handleControllerMark}
          />
        </footer>
      ) : (
        <footer className="controls">
          <button className="control-btn" onClick={handleUseHint} disabled={hints <= 0 || isComplete || isGameOver} aria-label={`힌트 사용 (${hints}개 남음)`}>
            <span className="icon">
              <LightbulbIcon size={24} color="var(--text)" />
            </span>
            <span className="label">힌트</span>
            {hints > 0 && <span className="count">{hints}</span>}
          </button>
          <button
            className={`control-btn mode-toggle ${mode === 'fill' ? 'mode-fill' : 'mode-mark'}`}
            onClick={onToggleMode}
            disabled={isGameOver}
            aria-label={`모드 전환 (현재 ${mode === 'fill' ? '색칠' : 'X표시'} 모드)`}
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
          <button
            className="control-btn mode-switch-btn"
            onClick={() => setControllerMode(true)}
            aria-label="컨트롤러 모드로 전환"
          >
            <span className="icon">
              <ControllerIcon size={24} color="var(--text)" />
            </span>
            <span className="label">컨트롤러</span>
          </button>
        </footer>
      )}

      {/* Complete Modal */}
      {isComplete && (
        <CompleteModal
          level={level}
          time={elapsedTime}
          puzzleName={isDaily ? '오늘의 퍼즐' : puzzle.name}
          stars={stars}
          onHome={onGoHome}
          onNext={isDaily ? null : onNextLevel}
          puzzle={puzzle}
          isDaily={isDaily}
        />
      )}

      {/* Game Over Modal */}
      {isGameOver && (
        <GameOverModal
          level={level}
          onRestart={onRestartLevel}
          onHome={onGoHome}
          onRevive={onRevive}
          usedRevive={usedRevive}
        />
      )}
    </div>
  );
}
