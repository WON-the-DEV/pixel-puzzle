import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { COLLECTION_DATA, createCollectionPuzzle, checkMultiColorSolution, generateMultiColorClues, transposeGrid } from '../lib/collections.js';
import { playFill, playMark, playLineComplete, playPuzzleComplete, playUndo, playHint, playLifeLost, playGameOver, playAutoX } from '../lib/sound.js';
import { hapticFill, hapticLineComplete, hapticPuzzleComplete, hapticLifeLost, hapticGameOver } from '../lib/haptic.js';
import { loadSettings } from '../lib/settings.js';
import { BackIcon, HeartIcon, LightbulbIcon, UndoIcon, RedoIcon, PencilIcon, XMarkIcon, CheckIcon } from './icons/Icons.jsx';

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ── Game Reducer ──
function cloneGrid(grid) {
  return grid.map(r => [...r]);
}

function createEmptyGrid(size) {
  return Array(size).fill(null).map(() => Array(size).fill(0));
}

function isRowComplete(solution, playerGrid, rowIndex) {
  const size = solution[rowIndex].length;
  for (let j = 0; j < size; j++) {
    const expected = solution[rowIndex][j];
    const actual = playerGrid[rowIndex][j];
    if (expected > 0 && actual !== expected) return false;
    if (expected === 0 && actual > 0) return false;
  }
  return true;
}

function isColComplete(solution, playerGrid, colIndex) {
  const size = solution.length;
  for (let i = 0; i < size; i++) {
    const expected = solution[i][colIndex];
    const actual = playerGrid[i][colIndex];
    if (expected > 0 && actual !== expected) return false;
    if (expected === 0 && actual > 0) return false;
  }
  return true;
}

function autoFillMultiColor(solution, playerGrid) {
  const size = solution.length;
  const grid = playerGrid.map(r => [...r]);
  let changed = true;
  const autoFilledCells = [];

  while (changed) {
    changed = false;
    for (let i = 0; i < size; i++) {
      if (isRowComplete(solution, grid, i)) {
        for (let j = 0; j < size; j++) {
          if (solution[i][j] === 0 && grid[i][j] === 0) {
            grid[i][j] = -1; // X mark for multicolor
            autoFilledCells.push({ row: i, col: j });
            changed = true;
          }
        }
      }
    }
    for (let j = 0; j < size; j++) {
      if (isColComplete(solution, grid, j)) {
        for (let i = 0; i < size; i++) {
          if (solution[i][j] === 0 && grid[i][j] === 0) {
            grid[i][j] = -1;
            autoFilledCells.push({ row: i, col: j });
            changed = true;
          }
        }
      }
    }
  }
  return { grid, autoFilledCells };
}

function getFilledCorrectCount(solution, playerGrid) {
  const size = solution.length;
  let count = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (solution[i][j] > 0 && playerGrid[i][j] === solution[i][j]) {
        count++;
      }
    }
  }
  return count;
}

function getHintMultiColor(solution, playerGrid) {
  const size = solution.length;
  const candidates = [];
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const expected = solution[i][j];
      const actual = playerGrid[i][j];
      if (expected > 0 && actual !== expected) {
        candidates.push({ row: i, col: j, value: expected });
      } else if (expected === 0 && actual > 0 && actual !== -1) {
        candidates.push({ row: i, col: j, value: -1 });
      }
    }
  }
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

const INITIAL_STATE = {
  puzzle: null,
  playerGrid: [],
  selectedColor: 1,
  mode: 'fill', // 'fill' | 'mark'
  history: [],
  historyIndex: -1,
  startTime: null,
  elapsedTime: 0,
  isComplete: false,
  lives: 3,
  maxLives: 3,
  isGameOver: false,
  autoXCells: [],
  filledCorrect: 0,
  lostLife: false,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START': {
      const { puzzle } = action;
      const playerGrid = createEmptyGrid(puzzle.size);
      return {
        ...INITIAL_STATE,
        puzzle,
        playerGrid,
        selectedColor: puzzle.usedColors[0] || 1,
        history: [cloneGrid(playerGrid)],
        historyIndex: 0,
        startTime: Date.now(),
      };
    }
    case 'SET_COLOR':
      return { ...state, selectedColor: action.color };
    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'fill' ? 'mark' : 'fill' };
    case 'TOGGLE_CELL': {
      if (state.isComplete || state.isGameOver) return state;
      const { row, col } = action;
      const newGrid = cloneGrid(state.playerGrid);
      const current = newGrid[row][col];
      let newLives = state.lives;
      let isGameOver = false;
      let lostLife = false;

      if (state.mode === 'fill') {
        const colorVal = state.selectedColor;
        if (current === colorVal) {
          newGrid[row][col] = 0;
        } else if (current > 0 && current !== -1) {
          // Already a different color — check if it matches solution
          const expected = state.puzzle.solution[row][col];
          if (colorVal === expected) {
            newGrid[row][col] = colorVal;
          } else {
            newLives = Math.max(0, state.lives - 1);
            lostLife = true;
            if (newLives === 0) isGameOver = true;
            newGrid[row][col] = -1;
          }
        } else {
          const expected = state.puzzle.solution[row][col];
          if (expected === colorVal) {
            newGrid[row][col] = colorVal;
          } else if (expected > 0 && expected !== colorVal) {
            newLives = Math.max(0, state.lives - 1);
            lostLife = true;
            if (newLives === 0) isGameOver = true;
            newGrid[row][col] = -1;
          } else if (expected === 0) {
            newLives = Math.max(0, state.lives - 1);
            lostLife = true;
            if (newLives === 0) isGameOver = true;
            newGrid[row][col] = -1;
          }
        }
      } else {
        newGrid[row][col] = current === -1 ? 0 : -1;
      }

      const { grid: autoGrid, autoFilledCells } = autoFillMultiColor(state.puzzle.solution, newGrid);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();

      const isComplete = !isGameOver && checkMultiColorSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);

      return {
        ...state,
        playerGrid: autoGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        lives: newLives,
        isGameOver,
        lostLife,
        autoXCells: autoFilledCells,
        filledCorrect,
      };
    }
    case 'FILL_CELL': {
      if (state.isComplete || state.isGameOver) return state;
      const { row, col, value } = action;
      if (state.playerGrid[row][col] === value) return state;
      const newGrid = cloneGrid(state.playerGrid);

      if (value > 0) {
        const expected = state.puzzle.solution[row][col];
        if (expected !== value) {
          const newLives = Math.max(0, state.lives - 1);
          newGrid[row][col] = -1;
          if (newLives === 0) {
            return { ...state, playerGrid: newGrid, lives: newLives, isGameOver: true, lostLife: true };
          }
          return { ...state, playerGrid: newGrid, lives: newLives, lostLife: true };
        }
      }
      newGrid[row][col] = value;
      return { ...state, playerGrid: newGrid };
    }
    case 'END_DRAG': {
      if (state.isGameOver) return state;
      const { grid: autoGrid, autoFilledCells } = autoFillMultiColor(state.puzzle.solution, state.playerGrid);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();
      const isComplete = checkMultiColorSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);
      return {
        ...state,
        playerGrid: autoGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        autoXCells: autoFilledCells,
        filledCorrect,
      };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0 || state.isGameOver) return state;
      const idx = state.historyIndex - 1;
      const grid = cloneGrid(state.history[idx]);
      return { ...state, playerGrid: grid, historyIndex: idx, autoXCells: [], filledCorrect: getFilledCorrectCount(state.puzzle.solution, grid) };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1 || state.isGameOver) return state;
      const idx = state.historyIndex + 1;
      const grid = cloneGrid(state.history[idx]);
      return { ...state, playerGrid: grid, historyIndex: idx, autoXCells: [], filledCorrect: getFilledCorrectCount(state.puzzle.solution, grid) };
    }
    case 'USE_HINT': {
      if (state.isComplete || state.isGameOver) return state;
      const hint = getHintMultiColor(state.puzzle.solution, state.playerGrid);
      if (!hint) return state;
      const newGrid = cloneGrid(state.playerGrid);
      newGrid[hint.row][hint.col] = hint.value;
      const { grid: autoGrid, autoFilledCells } = autoFillMultiColor(state.puzzle.solution, newGrid);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();
      const isComplete = checkMultiColorSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);
      return {
        ...state,
        playerGrid: autoGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        autoXCells: autoFilledCells,
        filledCorrect,
      };
    }
    case 'RESTART': {
      if (!state.puzzle) return state;
      const playerGrid = createEmptyGrid(state.puzzle.size);
      return {
        ...INITIAL_STATE,
        puzzle: state.puzzle,
        playerGrid,
        selectedColor: state.puzzle.usedColors[0] || 1,
        history: [cloneGrid(playerGrid)],
        historyIndex: 0,
        startTime: Date.now(),
      };
    }
    default:
      return state;
  }
}

// ── MultiColor Canvas ──
function MultiColorCanvas({ puzzle, playerGrid, selectedColor, mode, onToggleCell, onFillCell, onEndDrag, isComplete, showMistakes, autoXCells }) {
  const canvasRef = useRef(null);
  const interactionRef = useRef({ isDown: false, isDragging: false, dragValue: null, startCell: null, startX: 0, startY: 0 });
  const highlightRef = useRef({ row: -1, col: -1 });
  const layoutRef = useRef(null);

  const getLayout = useCallback(() => {
    if (!puzzle) return null;
    const size = puzzle.size;
    const maxWidth = Math.min(window.innerWidth - 32, 468);
    const maxClueWidth = size <= 5 ? 60 : size <= 10 ? 80 : 90;
    const maxClueHeight = size <= 5 ? 60 : size <= 10 ? 80 : 90;
    const availableWidth = maxWidth - maxClueWidth - 16;
    const cellSize = Math.floor(availableWidth / size);
    const clueWidth = maxClueWidth;
    const clueHeight = maxClueHeight;
    const padding = 8;
    const width = clueWidth + size * cellSize + padding * 2;
    const height = clueHeight + size * cellSize + padding * 2;
    const offsetX = padding + clueWidth;
    const offsetY = padding + clueHeight;
    return { size, cellSize, clueWidth, clueHeight, padding, width, height, offsetX, offsetY };
  }, [puzzle]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !puzzle || !playerGrid) return;
    const layout = getLayout();
    if (!layout) return;
    layoutRef.current = layout;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const COLORS = {
      bg: isDark ? '#1E2A45' : '#ffffff',
      grid: isDark ? '#2D3A56' : '#E5E7EB',
      gridBold: isDark ? '#64748B' : '#9CA3AF',
      clueText: isDark ? '#E2E8F0' : '#1A1A2E',
      clueComplete: isDark ? '#475569' : '#D1D5DB',
      highlight: '#6C5CE7',
      highlightBg: isDark ? 'rgba(124, 108, 240, 0.12)' : 'rgba(108, 92, 231, 0.08)',
      completedRowBg: isDark ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.05)',
      autoXMark: '#6C5CE7',
    };

    const { size, cellSize, clueWidth, clueHeight, padding, width, height, offsetX, offsetY } = layout;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    const { row: hRow, col: hCol } = highlightRef.current;

    // Completed row/col tint
    for (let i = 0; i < size; i++) {
      if (isRowComplete(puzzle.solution, playerGrid, i)) {
        ctx.fillStyle = COLORS.completedRowBg;
        ctx.fillRect(0, offsetY + i * cellSize, width, cellSize);
      }
    }
    for (let j = 0; j < size; j++) {
      if (isColComplete(puzzle.solution, playerGrid, j)) {
        ctx.fillStyle = COLORS.completedRowBg;
        ctx.fillRect(offsetX + j * cellSize, 0, cellSize, height);
      }
    }

    // Highlight
    if (hRow >= 0) {
      ctx.fillStyle = COLORS.highlightBg;
      ctx.fillRect(0, offsetY + hRow * cellSize, width, cellSize);
    }
    if (hCol >= 0) {
      ctx.fillStyle = COLORS.highlightBg;
      ctx.fillRect(offsetX + hCol * cellSize, 0, cellSize, height);
    }

    // ── Multi-color clues ──
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const clueFont = size <= 5 ? 'bold 12px system-ui' : 'bold 10px system-ui';
    const dotRadius = size <= 5 ? 3 : 2.5;

    // Row clues
    puzzle.rowClues.forEach((clues, i) => {
      const complete = isRowComplete(puzzle.solution, playerGrid, i);
      const y = offsetY + i * cellSize + cellSize / 2;
      ctx.font = clueFont;

      // Calculate total width of clues
      const clueTexts = clues.map(c => c.count.toString());
      const totalWidth = clueTexts.reduce((sum, t) => {
        ctx.font = clueFont;
        return sum + ctx.measureText(t).width + (dotRadius * 2 + 4);
      }, 0);
      
      let cx = padding + clueWidth / 2 - totalWidth / 2;
      
      clues.forEach((clue, k) => {
        const text = clue.count.toString();
        const tw = ctx.measureText(text).width;
        
        // Color dot
        if (clue.colorIndex > 0 && puzzle.palette) {
          ctx.fillStyle = complete ? COLORS.clueComplete : (puzzle.palette[clue.colorIndex - 1] || '#888');
          ctx.beginPath();
          ctx.arc(cx + dotRadius, y, dotRadius, 0, Math.PI * 2);
          ctx.fill();
          cx += dotRadius * 2 + 2;
        }
        
        // Number
        ctx.fillStyle = complete ? COLORS.clueComplete : (i === hRow ? COLORS.highlight : COLORS.clueText);
        ctx.fillText(text, cx + tw / 2, y);
        cx += tw + 4;
      });
    });

    // Col clues
    puzzle.colClues.forEach((clues, j) => {
      const complete = isColComplete(puzzle.solution, playerGrid, j);
      const x = offsetX + j * cellSize + cellSize / 2;
      ctx.font = clueFont;

      clues.forEach((clue, k) => {
        const yBase = padding + clueHeight - (clues.length - k) * (size <= 5 ? 18 : 14) + 4;
        
        // Color dot
        if (clue.colorIndex > 0 && puzzle.palette) {
          ctx.fillStyle = complete ? COLORS.clueComplete : (puzzle.palette[clue.colorIndex - 1] || '#888');
          ctx.beginPath();
          ctx.arc(x - 8, yBase, dotRadius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Number
        ctx.fillStyle = complete ? COLORS.clueComplete : (j === hCol ? COLORS.highlight : COLORS.clueText);
        ctx.fillText(clue.count.toString(), x + 2, yBase);
      });
    });

    // ── Grid lines ──
    for (let i = 0; i <= size; i++) {
      const y = offsetY + i * cellSize;
      const x = offsetX + i * cellSize;
      const isBold = i % 5 === 0;
      ctx.strokeStyle = isBold ? COLORS.gridBold : COLORS.grid;
      ctx.lineWidth = isBold ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + size * cellSize, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, offsetY);
      ctx.lineTo(x, offsetY + size * cellSize);
      ctx.stroke();
    }

    // ── Cells ──
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const cell = playerGrid[i][j];
        const x = offsetX + j * cellSize;
        const y = offsetY + i * cellSize;

        if (cell > 0) {
          // Colored fill
          ctx.fillStyle = puzzle.palette[cell - 1] || '#888';
          const inset = Math.max(2, cellSize * 0.06);
          const r = Math.max(2, cellSize * 0.1);
          const cx = x + inset;
          const cy = y + inset;
          const cw = cellSize - inset * 2;
          const ch = cellSize - inset * 2;
          ctx.beginPath();
          ctx.moveTo(cx + r, cy);
          ctx.lineTo(cx + cw - r, cy);
          ctx.quadraticCurveTo(cx + cw, cy, cx + cw, cy + r);
          ctx.lineTo(cx + cw, cy + ch - r);
          ctx.quadraticCurveTo(cx + cw, cy + ch, cx + cw - r, cy + ch);
          ctx.lineTo(cx + r, cy + ch);
          ctx.quadraticCurveTo(cx, cy + ch, cx, cy + ch - r);
          ctx.lineTo(cx, cy + r);
          ctx.quadraticCurveTo(cx, cy, cx + r, cy);
          ctx.closePath();
          ctx.fill();
        } else if (cell === -1) {
          // X mark
          ctx.strokeStyle = COLORS.clueComplete;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          const m = cellSize * 0.28;
          ctx.beginPath();
          ctx.moveTo(x + m, y + m);
          ctx.lineTo(x + cellSize - m, y + cellSize - m);
          ctx.moveTo(x + cellSize - m, y + m);
          ctx.lineTo(x + m, y + cellSize - m);
          ctx.stroke();
          ctx.lineCap = 'butt';
        }
      }
    }
  }, [puzzle, playerGrid, getLayout, isComplete, showMistakes, autoXCells]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => {
    const h = () => render();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [render]);
  useEffect(() => {
    const observer = new MutationObserver(() => render());
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, [render]);

  const getCellAt = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor((x - layout.offsetX) / layout.cellSize);
    const row = Math.floor((y - layout.offsetY) / layout.cellSize);
    if (row >= 0 && row < layout.size && col >= 0 && col < layout.size) {
      return { row, col };
    }
    return null;
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (isComplete) return;
    const touch = e.touches ? e.touches[0] : e;
    if (e.touches) e.preventDefault();
    const cell = getCellAt(touch.clientX, touch.clientY);
    if (!cell) return;
    const interaction = interactionRef.current;
    interaction.isDown = true;
    interaction.isDragging = false;
    interaction.startCell = cell;
    interaction.startX = touch.clientX;
    interaction.startY = touch.clientY;
    interaction.dragValue = null;
    highlightRef.current = { row: cell.row, col: cell.col };
    render();
  }, [getCellAt, isComplete, render]);

  const handlePointerMove = useCallback((e) => {
    const touch = e.touches ? e.touches[0] : e;
    if (e.touches) e.preventDefault();
    const interaction = interactionRef.current;
    const cell = getCellAt(touch.clientX, touch.clientY);
    if (cell) highlightRef.current = { row: cell.row, col: cell.col };
    else highlightRef.current = { row: -1, col: -1 };

    if (interaction.isDown && !interaction.isDragging) {
      const dx = touch.clientX - interaction.startX;
      const dy = touch.clientY - interaction.startY;
      if (Math.sqrt(dx * dx + dy * dy) >= 8) {
        interaction.isDragging = true;
        const sc = interaction.startCell;
        if (sc && !isComplete) {
          const current = playerGrid[sc.row][sc.col];
          let fillVal;
          if (mode === 'fill') {
            fillVal = current === selectedColor ? 0 : selectedColor;
          } else {
            fillVal = current === -1 ? 0 : -1;
          }
          interaction.dragValue = fillVal;
          onToggleCell(sc.row, sc.col);
        }
      }
    }

    if (interaction.isDragging && interaction.dragValue !== null && cell && !isComplete) {
      onFillCell(cell.row, cell.col, interaction.dragValue);
    }
    render();
  }, [getCellAt, onFillCell, onToggleCell, render, isComplete, playerGrid, mode, selectedColor]);

  const handlePointerUp = useCallback((e) => {
    const interaction = interactionRef.current;
    if (interaction.isDown && !interaction.isDragging) {
      const cell = interaction.startCell;
      if (cell && !isComplete) onToggleCell(cell.row, cell.col);
    }
    if (interaction.isDragging) onEndDrag();
    interaction.isDown = false;
    interaction.isDragging = false;
    interaction.dragValue = null;
    interaction.startCell = null;
    highlightRef.current = { row: -1, col: -1 };
    render();
  }, [onEndDrag, onToggleCell, render, isComplete]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onTouchCancel={handlePointerUp}
      />
    </div>
  );
}

// ── Main Screen ──
export default function CollectionGameScreen({ collectionId, tileRow, tileCol, onGoHome, onComplete, hints, onUseHint }) {
  const collection = COLLECTION_DATA.find(c => c.id === collectionId);
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [displayTime, setDisplayTime] = useState('00:00');
  const timerRef = useRef(null);
  const wasCompleteRef = useRef(false);
  const settings = loadSettings();

  // Initialize puzzle
  useEffect(() => {
    if (!collection) return;
    const puzzle = createCollectionPuzzle(collection, tileRow, tileCol);
    dispatch({ type: 'START', puzzle });
  }, [collection, tileRow, tileCol]);

  // Timer
  useEffect(() => {
    if (state.isComplete || state.isGameOver) {
      if (state.isComplete) setDisplayTime(formatTime(state.elapsedTime));
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (!state.startTime) return;
    const tick = () => setDisplayTime(formatTime(Date.now() - state.startTime));
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.startTime, state.isComplete, state.elapsedTime, state.isGameOver]);

  // Completion callback
  useEffect(() => {
    if (state.isComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true;
      playPuzzleComplete();
      hapticPuzzleComplete();
      if (onComplete) onComplete(collectionId, tileRow, tileCol);
    }
  }, [state.isComplete, collectionId, tileRow, tileCol, onComplete]);

  // Life loss sound
  useEffect(() => {
    if (state.lostLife && !state.isGameOver) {
      playLifeLost();
      hapticLifeLost();
    }
  }, [state.lostLife, state.lives, state.isGameOver]);

  // Game over sound
  useEffect(() => {
    if (state.isGameOver) {
      playGameOver();
      hapticGameOver();
    }
  }, [state.isGameOver]);

  const handleToggleCell = useCallback((row, col) => {
    if (state.isComplete || state.isGameOver) return;
    if (state.mode === 'fill') playFill();
    else playMark();
    hapticFill();
    dispatch({ type: 'TOGGLE_CELL', row, col });
  }, [state.mode, state.isComplete, state.isGameOver]);

  const handleFillCell = useCallback((row, col, value) => {
    dispatch({ type: 'FILL_CELL', row, col, value });
  }, []);

  const handleEndDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);

  const handleUndo = useCallback(() => {
    playUndo();
    dispatch({ type: 'UNDO' });
  }, []);

  const handleRedo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const handleHint = useCallback(() => {
    if (onUseHint && onUseHint()) {
      playHint();
      dispatch({ type: 'USE_HINT' });
    }
  }, [onUseHint]);

  const handleRestart = useCallback(() => {
    wasCompleteRef.current = false;
    dispatch({ type: 'RESTART' });
  }, []);

  if (!state.puzzle) return null;

  const progressPercent = state.puzzle.totalFilled > 0 ? Math.round((state.filledCorrect / state.puzzle.totalFilled) * 100) : 0;
  const tileNumber = tileRow * collection.tileCols + tileCol + 1;

  return (
    <div className="game-screen">
      {/* Header */}
      <header className="game-header">
        <button className="back-btn" onClick={onGoHome} aria-label="뒤로">
          <BackIcon size={24} />
        </button>
        <div className="level-info">
          <span className="level-number">
            {collection.emoji} {collection.name}
            <span className="puzzle-name"> · #{tileNumber}</span>
          </span>
          <span className="level-size">{state.puzzle.size}×{state.puzzle.size}</span>
        </div>
        <div className="header-right">
          <div className="lives-display">
            {Array.from({ length: state.maxLives }, (_, i) => (
              <span key={i} className={`life-heart ${i < state.lives ? 'active' : 'lost'}`}>
                <HeartIcon size={16} filled={i < state.lives} color={i < state.lives ? 'var(--danger)' : 'var(--text-tertiary)'} />
              </span>
            ))}
          </div>
          <div className="timer">{displayTime}</div>
        </div>
      </header>

      {/* Progress */}
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="progress-text">{state.filledCorrect}/{state.puzzle.totalFilled}</span>
      </div>

      {/* Color palette */}
      {state.puzzle.isMultiColor && (
        <div className="color-palette-bar">
          {state.puzzle.usedColors.map((colorIdx) => (
            <button
              key={colorIdx}
              className={`color-palette-btn ${state.selectedColor === colorIdx ? 'selected' : ''}`}
              onClick={() => dispatch({ type: 'SET_COLOR', color: colorIdx })}
              style={{
                '--palette-color': state.puzzle.palette[colorIdx - 1],
              }}
            >
              <span
                className="color-palette-swatch"
                style={{ backgroundColor: state.puzzle.palette[colorIdx - 1] }}
              />
              {state.selectedColor === colorIdx && (
                <CheckIcon size={12} color="white" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <main className="game-container">
        <MultiColorCanvas
          puzzle={state.puzzle}
          playerGrid={state.playerGrid}
          selectedColor={state.selectedColor}
          mode={state.mode}
          onToggleCell={handleToggleCell}
          onFillCell={handleFillCell}
          onEndDrag={handleEndDrag}
          isComplete={state.isComplete}
          showMistakes={settings.showMistakes}
          autoXCells={state.autoXCells}
        />
      </main>

      {/* Controls */}
      <footer className="controls">
        <button className="control-btn" onClick={handleHint} disabled={hints <= 0 || state.isComplete || state.isGameOver}>
          <span className="icon"><LightbulbIcon size={24} color="var(--text)" /></span>
          <span className="label">힌트</span>
          {hints > 0 && <span className="count">{hints}</span>}
        </button>
        <button className="control-btn" onClick={handleUndo} disabled={state.isGameOver}>
          <span className="icon"><UndoIcon size={24} /></span>
          <span className="label">실행취소</span>
        </button>
        <button className="control-btn" onClick={handleRedo} disabled={state.isGameOver}>
          <span className="icon"><RedoIcon size={24} /></span>
          <span className="label">다시실행</span>
        </button>
        <button
          className={`control-btn mode-toggle ${state.mode === 'fill' ? 'mode-fill' : 'mode-mark'}`}
          onClick={() => dispatch({ type: 'TOGGLE_MODE' })}
          disabled={state.isGameOver}
        >
          <div className="mode-toggle-inner">
            <div className={`mode-option ${state.mode === 'fill' ? 'active' : ''}`}>
              <span className="mode-icon"><PencilIcon size={18} color={state.mode === 'fill' ? 'var(--accent)' : 'var(--text-secondary)'} /></span>
              <span className="mode-label">색칠</span>
            </div>
            <div className={`mode-option ${state.mode === 'mark' ? 'active' : ''}`}>
              <span className="mode-icon"><XMarkIcon size={18} color={state.mode === 'mark' ? 'var(--danger)' : 'var(--text-secondary)'} /></span>
              <span className="mode-label">X표시</span>
            </div>
          </div>
        </button>
      </footer>

      {/* Complete Modal */}
      {state.isComplete && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onGoHome()}>
          <div className="modal-content">
            <div className="modal-icon" style={{ fontSize: 56 }}>{collection.emoji}</div>
            <h2>타일 완료!</h2>
            <p className="puzzle-complete-name">{collection.name} #{tileNumber}</p>
            <div className="result-stats">
              <div className="result-stat">
                <span className="result-stat-value">{state.puzzle.size}×{state.puzzle.size}</span>
                <span className="result-stat-label">크기</span>
              </div>
              <div className="result-divider" />
              <div className="result-stat">
                <span className="result-stat-value">{formatTime(state.elapsedTime)}</span>
                <span className="result-stat-label">클리어 시간</span>
              </div>
            </div>
            <p className="hint-earned-text">
              <LightbulbIcon size={16} color="var(--success)" />
              힌트 +1 획득!
            </p>
            <div className="modal-buttons">
              <button className="primary-btn" onClick={onGoHome}>
                컬렉션으로 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {state.isGameOver && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onGoHome()}>
          <div className="modal-content game-over-modal">
            <div className="modal-icon" style={{ fontSize: 56 }}>💔</div>
            <h2>게임 오버</h2>
            <p className="game-over-desc">라이프를 모두 소진했어요</p>
            <div className="modal-buttons">
              <button className="secondary-btn" onClick={onGoHome}>홈으로</button>
              <button className="primary-btn" onClick={handleRestart}>다시 시작</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
