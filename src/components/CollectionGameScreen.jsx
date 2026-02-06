import { useState, useEffect, useRef, useCallback, useReducer } from 'react';
import { COLLECTION_DATA, createCollectionPuzzle, checkMonoSolution } from '../lib/collections.js';
import { playFill, playMark, playLineComplete, playPuzzleComplete, playUndo, playHint, playLifeLost, playGameOver, playAutoX } from '../lib/sound.js';
import { hapticFill, hapticLineComplete, hapticPuzzleComplete, hapticLifeLost, hapticGameOver } from '../lib/haptic.js';
import { BackIcon, HeartIcon, LightbulbIcon, PencilIcon, XMarkIcon, VideoIcon, TouchIcon, ControllerIcon } from './icons/Icons.jsx';
import ControllerPad from './ControllerPad.jsx';

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ── Helpers ──
function cloneGrid(grid) { return grid.map(r => [...r]); }
function createEmptyGrid(size) { return Array(size).fill(null).map(() => Array(size).fill(0)); }

function isRowComplete(solution, playerGrid, rowIdx) {
  for (let j = 0; j < solution[rowIdx].length; j++) {
    if (solution[rowIdx][j] > 0 && playerGrid[rowIdx][j] !== 1) return false;
    if (solution[rowIdx][j] === 0 && playerGrid[rowIdx][j] === 1) return false;
  }
  return true;
}

function isColComplete(solution, playerGrid, colIdx) {
  for (let i = 0; i < solution.length; i++) {
    if (solution[i][colIdx] > 0 && playerGrid[i][colIdx] !== 1) return false;
    if (solution[i][colIdx] === 0 && playerGrid[i][colIdx] === 1) return false;
  }
  return true;
}

function autoFillCompleted(solution, playerGrid) {
  const size = solution.length;
  const grid = cloneGrid(playerGrid);
  let changed = true;
  const autoFilledCells = [];
  while (changed) {
    changed = false;
    for (let i = 0; i < size; i++) {
      if (isRowComplete(solution, grid, i)) {
        for (let j = 0; j < size; j++) {
          if (solution[i][j] === 0 && grid[i][j] === 0) {
            grid[i][j] = 2;
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
            grid[i][j] = 2;
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
  let count = 0;
  for (let i = 0; i < solution.length; i++)
    for (let j = 0; j < solution[i].length; j++)
      if (solution[i][j] > 0 && playerGrid[i][j] === 1) count++;
  return count;
}

function getHint(solution, playerGrid) {
  const candidates = [];
  for (let i = 0; i < solution.length; i++)
    for (let j = 0; j < solution[i].length; j++) {
      if (solution[i][j] > 0 && playerGrid[i][j] !== 1) candidates.push({ row: i, col: j });
      else if (solution[i][j] === 0 && playerGrid[i][j] === 1) candidates.push({ row: i, col: j });
    }
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

// ── Reducer (단색) ──
const INITIAL_STATE = {
  puzzle: null, playerGrid: [], mode: 'fill',
  history: [], historyIndex: -1,
  startTime: null, elapsedTime: 0,
  isComplete: false, lives: 3, maxLives: 3,
  isGameOver: false, autoXCells: [], filledCorrect: 0, lostLife: false,
  mistakeFlashCells: [],
  usedRevive: false,
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'START': {
      const { puzzle } = action;
      const playerGrid = createEmptyGrid(puzzle.size);

      for (let i = 0; i < puzzle.size; i++) {
        if (puzzle.rowClues[i].length === 1 && puzzle.rowClues[i][0] === 0) {
          for (let j = 0; j < puzzle.size; j++) playerGrid[i][j] = 2;
        }
      }
      for (let j = 0; j < puzzle.size; j++) {
        if (puzzle.colClues[j].length === 1 && puzzle.colClues[j][0] === 0) {
          for (let i = 0; i < puzzle.size; i++) playerGrid[i][j] = 2;
        }
      }

      return { ...INITIAL_STATE, puzzle, playerGrid, history: [cloneGrid(playerGrid)], historyIndex: 0, startTime: Date.now() };
    }
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
      let mistakeFlashCells = [];

      if (state.mode === 'fill') {
        if (current === 2) return state;
        if (current === 1) {
          newGrid[row][col] = 0;
        } else {
          const expected = state.puzzle.solution[row][col];
          if (expected > 0) {
            newGrid[row][col] = 1;
          } else {
            newLives = Math.max(0, state.lives - 1);
            lostLife = true;
            if (newLives === 0) isGameOver = true;
            newGrid[row][col] = 2;
            mistakeFlashCells = [{ row, col }];
          }
        }
      } else {
        newGrid[row][col] = current === 2 ? 0 : 2;
      }

      const { grid: autoGrid, autoFilledCells } = autoFillCompleted(state.puzzle.solution, newGrid);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();
      const isComplete = !isGameOver && checkMonoSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);

      return {
        ...state, playerGrid: autoGrid, history: newHistory, historyIndex: newHistory.length - 1,
        isComplete, elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        lives: newLives, isGameOver, lostLife, autoXCells: autoFilledCells, filledCorrect,
        mistakeFlashCells,
      };
    }
    case 'FILL_CELL': {
      if (state.isComplete || state.isGameOver) return state;
      const { row, col, value } = action;
      if (state.playerGrid[row][col] === value) return state;
      if (state.playerGrid[row][col] === 2) return state;
      if (state.playerGrid[row][col] === 1) return state;

      const newGrid = cloneGrid(state.playerGrid);
      if (value === 1) {
        const expected = state.puzzle.solution[row][col];
        if (expected === 0) {
          const newLives = Math.max(0, state.lives - 1);
          newGrid[row][col] = 2;
          if (newLives === 0) {
            return { ...state, playerGrid: newGrid, lives: newLives, isGameOver: true, lostLife: true };
          }
          return { ...state, playerGrid: newGrid, lives: newLives, lostLife: true };
        }
      }
      newGrid[row][col] = value;

      // 자동 X 채우기 (드래그 중에도 즉시 반영)
      const { grid: autoGridFill, autoFilledCells: autoFilledFill } = autoFillCompleted(state.puzzle.solution, newGrid);
      const filledCorrectFill = getFilledCorrectCount(state.puzzle.solution, autoGridFill);

      return { ...state, playerGrid: autoGridFill, autoXCells: autoFilledFill, filledCorrect: filledCorrectFill };
    }
    case 'END_DRAG': {
      if (state.isGameOver) return state;
      const { grid: autoGrid, autoFilledCells } = autoFillCompleted(state.puzzle.solution, state.playerGrid);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();
      const isComplete = checkMonoSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);
      return {
        ...state, playerGrid: autoGrid, history: newHistory, historyIndex: newHistory.length - 1,
        isComplete, elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        autoXCells: autoFilledCells, filledCorrect,
      };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0 || state.isGameOver) return state;
      const idx = state.historyIndex - 1;
      const grid = cloneGrid(state.history[idx]);
      return { ...state, playerGrid: grid, historyIndex: idx, autoXCells: [], filledCorrect: getFilledCorrectCount(state.puzzle.solution, grid), mistakeFlashCells: [] };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1 || state.isGameOver) return state;
      const idx = state.historyIndex + 1;
      const grid = cloneGrid(state.history[idx]);
      return { ...state, playerGrid: grid, historyIndex: idx, autoXCells: [], filledCorrect: getFilledCorrectCount(state.puzzle.solution, grid), mistakeFlashCells: [] };
    }
    case 'USE_HINT': {
      if (state.isComplete || state.isGameOver) return state;
      const hint = getHint(state.puzzle.solution, state.playerGrid);
      if (!hint) return state;
      const newGrid = cloneGrid(state.playerGrid);
      newGrid[hint.row][hint.col] = state.puzzle.solution[hint.row][hint.col] > 0 ? 1 : 2;
      const { grid: autoGrid, autoFilledCells } = autoFillCompleted(state.puzzle.solution, newGrid);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();
      const isComplete = checkMonoSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);
      return {
        ...state, playerGrid: autoGrid, history: newHistory, historyIndex: newHistory.length - 1,
        isComplete, elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        autoXCells: autoFilledCells, filledCorrect, mistakeFlashCells: [],
      };
    }
    case 'REVIVE': {
      if (!state.isGameOver || state.usedRevive) return state;
      return { ...state, lives: 1, isGameOver: false, usedRevive: true, lostLife: false };
    }
    case 'RESTART': {
      if (!state.puzzle) return state;
      const puzzle = state.puzzle;
      const playerGrid = createEmptyGrid(puzzle.size);

      for (let i = 0; i < puzzle.size; i++) {
        if (puzzle.rowClues[i].length === 1 && puzzle.rowClues[i][0] === 0) {
          for (let j = 0; j < puzzle.size; j++) playerGrid[i][j] = 2;
        }
      }
      for (let j = 0; j < puzzle.size; j++) {
        if (puzzle.colClues[j].length === 1 && puzzle.colClues[j][0] === 0) {
          for (let i = 0; i < puzzle.size; i++) playerGrid[i][j] = 2;
        }
      }

      return { ...INITIAL_STATE, puzzle, playerGrid, history: [cloneGrid(playerGrid)], historyIndex: 0, startTime: Date.now() };
    }
    default: return state;
  }
}

// ── Canvas (단색, MonoCanvas — simplified, no zoom) ──
function MonoCanvas({ puzzle, playerGrid, mode, onToggleCell, onFillCell, onEndDrag, isComplete, autoXCells, mistakeFlashCells, controllerMode, cursorRow, cursorCol, darkMode = false }) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const interactionRef = useRef({ isDown: false, isDragging: false, dragValue: null, startCell: null, startX: 0, startY: 0 });
  const highlightRef = useRef({ row: -1, col: -1 });
  const lastTouchRef = useRef({ row: -1, col: -1 });
  const layoutRef = useRef(null);
  const autoXAnimRef = useRef(new Set());
  const mistakeFlashAnimRef = useRef(new Set());

  const DRAG_THRESHOLD = 8;

  useEffect(() => {
    if (autoXCells && autoXCells.length > 0) {
      autoXAnimRef.current = new Set(autoXCells.map(c => `${c.row}-${c.col}`));
      const timer = setTimeout(() => { autoXAnimRef.current = new Set(); }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoXCells]);

  useEffect(() => {
    if (mistakeFlashCells && mistakeFlashCells.length > 0) {
      mistakeFlashAnimRef.current = new Set(mistakeFlashCells.map(c => `${c.row}-${c.col}`));
      const timer = setTimeout(() => {
        mistakeFlashAnimRef.current = new Set();
        requestAnimationFrame(() => render());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mistakeFlashCells]);

  const getLayout = useCallback(() => {
    if (!puzzle) return null;
    const size = puzzle.size;
    const screenWidth = window.innerWidth;
    const maxWidth = Math.min(screenWidth - 16, 500);

    const maxRowClueLen = Math.max(...puzzle.rowClues.map(c => c.length));
    const maxColClueLen = Math.max(...puzzle.colClues.map(c => c.length));

    let clueWidth, clueHeight;
    if (size <= 5) {
      clueWidth = Math.min(40, maxRowClueLen * 16 + 8);
      clueHeight = Math.min(40, maxColClueLen * 14 + 8);
    } else if (size <= 8) {
      clueWidth = Math.min(48, maxRowClueLen * 14 + 10);
      clueHeight = Math.min(48, maxColClueLen * 13 + 8);
    } else if (size <= 10) {
      clueWidth = Math.min(56, maxRowClueLen * 12 + 10);
      clueHeight = Math.min(56, maxColClueLen * 12 + 8);
    } else {
      clueWidth = Math.min(62, maxRowClueLen * 11 + 8);
      clueHeight = Math.min(62, maxColClueLen * 11 + 8);
    }

    const padding = 4;
    const availableWidth = maxWidth - clueWidth - padding * 2;
    const cellSize = Math.floor(availableWidth / size);

    const width = clueWidth + size * cellSize + padding * 2;
    const height = clueHeight + size * cellSize + padding * 2;
    return { size, cellSize, clueWidth, clueHeight, padding, width, height, offsetX: padding + clueWidth, offsetY: padding + clueHeight };
  }, [puzzle]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !puzzle || !playerGrid) return;
    const layout = getLayout();
    if (!layout) return;
    layoutRef.current = layout;

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const C = {
      bg: isDark ? '#1a1a2e' : '#ffffff',
      grid: isDark ? '#3a3a4e' : '#E5E7EB',
      gridBold: isDark ? '#64748B' : '#9CA3AF',
      cellFilled: isDark ? '#e0e0e0' : '#1B2838',
      clueText: isDark ? '#d0d0d0' : '#1A1A2E',
      clueComplete: isDark ? '#475569' : '#D1D5DB',
      highlight: '#6C5CE7',
      highlightBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(108,92,231,0.08)',
      touchHighlightBg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(108,92,231,0.05)',
      completedRowBg: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.10)',
      autoXMark: '#6C5CE7',
      mistakeBg: 'rgba(239,68,68,0.25)',
      mistakeBorder: isDark ? '#ff6b6b' : '#ef4444',
      xMark: isDark ? '#888888' : '#C0C4CC',
      cursorBorder: '#FF6B6B',
      cursorBg: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,107,107,0.12)',
    };

    const { size, cellSize, clueWidth, clueHeight, padding, width, height, offsetX, offsetY } = layout;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, width, height);

    const hRow = controllerMode ? cursorRow : highlightRef.current.row;
    const hCol = controllerMode ? cursorCol : highlightRef.current.col;
    const ltRow = lastTouchRef.current.row;
    const ltCol = lastTouchRef.current.col;

    for (let i = 0; i < size; i++) {
      if (isRowComplete(puzzle.solution, playerGrid, i)) {
        ctx.fillStyle = C.completedRowBg;
        ctx.fillRect(0, offsetY + i * cellSize, width, cellSize);
      }
    }
    for (let j = 0; j < size; j++) {
      if (isColComplete(puzzle.solution, playerGrid, j)) {
        ctx.fillStyle = C.completedRowBg;
        ctx.fillRect(offsetX + j * cellSize, 0, cellSize, height);
      }
    }

    // Touch mode last-touch highlight (lighter)
    if (!controllerMode && hRow < 0 && ltRow >= 0) {
      ctx.fillStyle = C.touchHighlightBg;
      ctx.fillRect(0, offsetY + ltRow * cellSize, width, cellSize);
    }
    if (!controllerMode && hCol < 0 && ltCol >= 0) {
      ctx.fillStyle = C.touchHighlightBg;
      ctx.fillRect(offsetX + ltCol * cellSize, 0, cellSize, height);
    }

    if (hRow >= 0) { ctx.fillStyle = C.highlightBg; ctx.fillRect(0, offsetY + hRow * cellSize, width, cellSize); }
    if (hCol >= 0) { ctx.fillStyle = C.highlightBg; ctx.fillRect(offsetX + hCol * cellSize, 0, cellSize, height); }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let clueFontSize;
    if (size <= 5) clueFontSize = 12;
    else if (size <= 8) clueFontSize = 11;
    else if (size <= 10) clueFontSize = 10;
    else clueFontSize = 9;
    const fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
    const clueFont = `bold ${clueFontSize}px ${fontFamily}`;

    puzzle.rowClues.forEach((clues, i) => {
      const complete = isRowComplete(puzzle.solution, playerGrid, i);
      const y = offsetY + i * cellSize + cellSize / 2;
      ctx.font = clueFont;
      if (complete) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#aaaaaa';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = i === hRow ? C.highlight : C.clueText;
      }
      ctx.fillText(clues.join(' '), padding + clueWidth / 2, y);
      ctx.globalAlpha = 1.0;
    });

    const colClueLineHeight = Math.min(15, cellSize * 0.65);
    puzzle.colClues.forEach((clues, j) => {
      const complete = isColComplete(puzzle.solution, playerGrid, j);
      const x = offsetX + j * cellSize + cellSize / 2;
      ctx.font = clueFont;
      if (complete) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#aaaaaa';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = j === hCol ? C.highlight : C.clueText;
      }
      clues.forEach((clue, k) => {
        const y = padding + clueHeight - (clues.length - k) * colClueLineHeight + colClueLineHeight / 2;
        ctx.fillText(clue.toString(), x, y);
      });
      ctx.globalAlpha = 1.0;
    });

    for (let i = 0; i <= size; i++) {
      const isBold = i % 5 === 0;
      ctx.strokeStyle = isBold ? C.gridBold : C.grid;
      ctx.lineWidth = isBold ? 1.5 : 0.5;
      ctx.beginPath(); ctx.moveTo(offsetX, offsetY + i * cellSize); ctx.lineTo(offsetX + size * cellSize, offsetY + i * cellSize); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(offsetX + i * cellSize, offsetY); ctx.lineTo(offsetX + i * cellSize, offsetY + size * cellSize); ctx.stroke();
    }

    const animAutoX = autoXAnimRef.current;
    const flashingMistakes = mistakeFlashAnimRef.current;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const cell = playerGrid[i][j];
        const x = offsetX + j * cellSize;
        const y = offsetY + i * cellSize;
        const key = `${i}-${j}`;

        if (flashingMistakes.has(key)) {
          ctx.fillStyle = C.mistakeBg;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = C.mistakeBorder;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }

        if (cell === 1) {
          ctx.fillStyle = C.cellFilled;
          const inset = Math.max(1.5, cellSize * 0.06);
          const r = Math.max(2, cellSize * 0.1);
          ctx.beginPath();
          ctx.moveTo(x + inset + r, y + inset);
          ctx.lineTo(x + cellSize - inset - r, y + inset);
          ctx.quadraticCurveTo(x + cellSize - inset, y + inset, x + cellSize - inset, y + inset + r);
          ctx.lineTo(x + cellSize - inset, y + cellSize - inset - r);
          ctx.quadraticCurveTo(x + cellSize - inset, y + cellSize - inset, x + cellSize - inset - r, y + cellSize - inset);
          ctx.lineTo(x + inset + r, y + cellSize - inset);
          ctx.quadraticCurveTo(x + inset, y + cellSize - inset, x + inset, y + cellSize - inset - r);
          ctx.lineTo(x + inset, y + inset + r);
          ctx.quadraticCurveTo(x + inset, y + inset, x + inset + r, y + inset);
          ctx.closePath();
          ctx.fill();
        } else if (cell === 2) {
          const isAuto = animAutoX.has(key);
          const isMistake = flashingMistakes.has(key);
          ctx.strokeStyle = isMistake ? C.mistakeBorder : isAuto ? C.autoXMark : C.xMark;
          ctx.lineWidth = isMistake ? 2.5 : 2;
          ctx.lineCap = 'round';
          const m = cellSize * 0.28;
          ctx.beginPath();
          ctx.moveTo(x + m, y + m); ctx.lineTo(x + cellSize - m, y + cellSize - m);
          ctx.moveTo(x + cellSize - m, y + m); ctx.lineTo(x + m, y + cellSize - m);
          ctx.stroke();
          ctx.lineCap = 'butt';
        }
      }
    }

    // Controller cursor
    if (controllerMode && cursorRow >= 0 && cursorRow < size && cursorCol >= 0 && cursorCol < size) {
      const cx = offsetX + cursorCol * cellSize;
      const cy = offsetY + cursorRow * cellSize;
      ctx.fillStyle = C.cursorBg;
      ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
      ctx.strokeStyle = C.cursorBorder;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx + 1.5, cy + 1.5, cellSize - 3, cellSize - 3);
    }
  }, [puzzle, playerGrid, getLayout, isComplete, autoXCells, mistakeFlashCells, controllerMode, cursorRow, cursorCol, darkMode]);

  useEffect(() => { render(); }, [render]);
  useEffect(() => { const h = () => render(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, [render]);
  useEffect(() => {
    const ob = new MutationObserver(() => render());
    ob.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => ob.disconnect();
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
    if (row >= 0 && row < layout.size && col >= 0 && col < layout.size) return { row, col };
    return null;
  }, []);

  const handlePointerDown = useCallback((e) => {
    if (isComplete || controllerMode) return;
    const touch = e.touches ? e.touches[0] : e;
    if (e.touches && e.touches.length > 1) return;
    if (e.type === 'touchstart') e.preventDefault();

    const cell = getCellAt(touch.clientX, touch.clientY);
    if (!cell) return;

    const i = interactionRef.current;
    i.isDown = true; i.isDragging = false; i.startCell = cell;
    i.startX = touch.clientX; i.startY = touch.clientY; i.dragValue = null;
    highlightRef.current = { row: cell.row, col: cell.col };
    lastTouchRef.current = { row: cell.row, col: cell.col };
    render();
  }, [getCellAt, isComplete, render, controllerMode]);

  const handlePointerMove = useCallback((e) => {
    if (controllerMode) return;
    const touch = e.touches ? e.touches[0] : e;
    if (e.touches && e.touches.length > 1) return;
    if (e.type === 'touchmove') e.preventDefault();

    const inter = interactionRef.current;
    const cell = getCellAt(touch.clientX, touch.clientY);
    if (cell) highlightRef.current = { row: cell.row, col: cell.col };
    else highlightRef.current = { row: -1, col: -1 };

    if (inter.isDown && !inter.isDragging) {
      const dx = touch.clientX - inter.startX;
      const dy = touch.clientY - inter.startY;
      if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
        inter.isDragging = true;
        const sc = inter.startCell;
        if (sc && !isComplete) {
          const cur = playerGrid[sc.row][sc.col];
          inter.dragValue = mode === 'fill' ? (cur === 1 ? 0 : 1) : (cur === 2 ? 0 : 2);
          onToggleCell(sc.row, sc.col);
        }
      }
    }
    if (inter.isDragging && inter.dragValue !== null && cell && !isComplete) {
      onFillCell(cell.row, cell.col, inter.dragValue);
    }
    render();
  }, [getCellAt, onFillCell, onToggleCell, render, isComplete, playerGrid, mode, controllerMode]);

  const handlePointerUp = useCallback((e) => {
    if (controllerMode) return;
    if (e.type === 'touchend') e.stopPropagation();
    const inter = interactionRef.current;

    if (inter.isDown && !inter.isDragging) {
      const cell = inter.startCell;
      if (cell && !isComplete) onToggleCell(cell.row, cell.col);
    }
    if (inter.isDragging) onEndDrag();
    inter.isDown = false; inter.isDragging = false; inter.dragValue = null; inter.startCell = null;
    highlightRef.current = { row: -1, col: -1 };
    render();
  }, [onEndDrag, onToggleCell, render, isComplete, controllerMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const opts = { passive: false };
    canvas.addEventListener('touchstart', handlePointerDown, opts);
    canvas.addEventListener('touchmove', handlePointerMove, opts);
    canvas.addEventListener('touchend', handlePointerUp, opts);
    canvas.addEventListener('touchcancel', handlePointerUp, opts);
    return () => {
      canvas.removeEventListener('touchstart', handlePointerDown, opts);
      canvas.removeEventListener('touchmove', handlePointerMove, opts);
      canvas.removeEventListener('touchend', handlePointerUp, opts);
      canvas.removeEventListener('touchcancel', handlePointerUp, opts);
    };
  }, [handlePointerDown, handlePointerMove, handlePointerUp]);

  return (
    <div ref={wrapperRef} className="canvas-wrapper">
      <canvas ref={canvasRef} className="game-canvas"
        onMouseDown={handlePointerDown} onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp} onMouseLeave={handlePointerUp}
      />
    </div>
  );
}

// ── Main Screen ──
export default function CollectionGameScreen({ collectionId, tileRow, tileCol, onGoHome, onComplete, hints, onUseHint, darkMode = false }) {
  const collection = COLLECTION_DATA.find(c => c.id === collectionId);
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
  const [displayTime, setDisplayTime] = useState('00:00');
  const timerRef = useRef(null);
  const wasCompleteRef = useRef(false);

  // Controller mode
  const [controllerMode, setControllerMode] = useState(false);
  const [cursorRow, setCursorRow] = useState(0);
  const [cursorCol, setCursorCol] = useState(0);

  useEffect(() => {
    if (!collection) return;
    const puzzle = createCollectionPuzzle(collection, tileRow, tileCol);
    dispatch({ type: 'START', puzzle });
    setCursorRow(0);
    setCursorCol(0);
  }, [collection, tileRow, tileCol]);

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

  useEffect(() => {
    if (state.isComplete && !wasCompleteRef.current) {
      wasCompleteRef.current = true;
      playPuzzleComplete();
      hapticPuzzleComplete();
      if (onComplete) onComplete(collectionId, tileRow, tileCol);
    }
  }, [state.isComplete, collectionId, tileRow, tileCol, onComplete]);

  useEffect(() => {
    if (state.lostLife && !state.isGameOver) { playLifeLost(); hapticLifeLost(); }
  }, [state.lostLife, state.lives, state.isGameOver]);

  useEffect(() => {
    if (state.isGameOver) { playGameOver(); hapticGameOver(); }
  }, [state.isGameOver]);

  const handleToggleCell = useCallback((row, col) => {
    if (state.isComplete || state.isGameOver) return;
    if (state.mode === 'fill') playFill(); else playMark();
    hapticFill();
    dispatch({ type: 'TOGGLE_CELL', row, col });
  }, [state.mode, state.isComplete, state.isGameOver]);

  const handleFillCell = useCallback((row, col, value) => { dispatch({ type: 'FILL_CELL', row, col, value }); }, []);
  const handleEndDrag = useCallback(() => { dispatch({ type: 'END_DRAG' }); }, []);
  const handleToggleMode = useCallback(() => { dispatch({ type: 'TOGGLE_MODE' }); }, []);
  const handleHint = useCallback(() => { if (onUseHint && onUseHint()) { playHint(); dispatch({ type: 'USE_HINT' }); } }, [onUseHint]);
  const handleRestart = useCallback(() => { wasCompleteRef.current = false; dispatch({ type: 'RESTART' }); }, []);
  const handleRevive = useCallback(() => { dispatch({ type: 'REVIVE' }); }, []);

  // Controller mode handlers
  const handleControllerMove = useCallback((direction) => {
    if (!state.puzzle) return;
    setCursorRow(prev => {
      if (direction === 'up') return Math.max(0, prev - 1);
      if (direction === 'down') return Math.min(state.puzzle.size - 1, prev + 1);
      return prev;
    });
    setCursorCol(prev => {
      if (direction === 'left') return Math.max(0, prev - 1);
      if (direction === 'right') return Math.min(state.puzzle.size - 1, prev + 1);
      return prev;
    });
    hapticFill();
  }, [state.puzzle]);

  const handleControllerFill = useCallback(() => {
    if (state.isComplete || state.isGameOver || !state.puzzle) return;
    playFill();
    hapticFill();
    if (state.mode !== 'fill') dispatch({ type: 'TOGGLE_MODE' });
    dispatch({ type: 'TOGGLE_CELL', row: cursorRow, col: cursorCol });
  }, [cursorRow, cursorCol, state.isComplete, state.isGameOver, state.puzzle, state.mode]);

  const handleControllerMark = useCallback(() => {
    if (state.isComplete || state.isGameOver || !state.puzzle) return;
    playMark();
    hapticFill();
    if (state.mode !== 'mark') dispatch({ type: 'TOGGLE_MODE' });
    dispatch({ type: 'TOGGLE_CELL', row: cursorRow, col: cursorCol });
  }, [cursorRow, cursorCol, state.isComplete, state.isGameOver, state.puzzle, state.mode]);

  if (!state.puzzle) return null;

  const progressPercent = state.puzzle.totalFilled > 0 ? Math.round((state.filledCorrect / state.puzzle.totalFilled) * 100) : 0;
  const tileNumber = tileRow * collection.tileCols + tileCol + 1;

  return (
    <div className="game-screen">
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

      <div className="progress-bar-container">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <span className="progress-text">{state.filledCorrect}/{state.puzzle.totalFilled}</span>
      </div>

      <main className="game-container">
        <MonoCanvas
          puzzle={state.puzzle}
          playerGrid={state.playerGrid}
          mode={state.mode}
          onToggleCell={handleToggleCell}
          onFillCell={handleFillCell}
          onEndDrag={handleEndDrag}
          isComplete={state.isComplete}
          autoXCells={state.autoXCells}
          mistakeFlashCells={state.mistakeFlashCells}
          controllerMode={controllerMode}
          cursorRow={cursorRow}
          cursorCol={cursorCol}
          darkMode={darkMode}
        />
      </main>

      {/* Controls */}
      {controllerMode ? (
        <footer className="controls controller-controls">
          <div className="controller-controls-row">
            <button className="control-btn" onClick={handleHint} disabled={hints <= 0 || state.isComplete || state.isGameOver}>
              <span className="icon"><LightbulbIcon size={24} color="var(--text)" /></span>
              <span className="label">힌트</span>
              {hints > 0 && <span className="count">{hints}</span>}
            </button>
            <ControllerPad
              onMove={handleControllerMove}
              onFill={handleControllerFill}
              onMark={handleControllerMark}
            />
            <button
              className="control-btn mode-switch-btn"
              onClick={() => setControllerMode(false)}
              aria-label="터치 모드로 전환"
            >
              <span className="icon"><TouchIcon size={24} color="var(--text)" /></span>
              <span className="label">터치</span>
            </button>
          </div>
        </footer>
      ) : (
        <footer className="controls">
          <button className="control-btn" onClick={handleHint} disabled={hints <= 0 || state.isComplete || state.isGameOver}>
            <span className="icon"><LightbulbIcon size={24} color="var(--text)" /></span>
            <span className="label">힌트</span>
            {hints > 0 && <span className="count">{hints}</span>}
          </button>
          <button
            className={`control-btn mode-toggle ${state.mode === 'fill' ? 'mode-fill' : 'mode-mark'}`}
            onClick={handleToggleMode}
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
          <button
            className="control-btn mode-switch-btn"
            onClick={() => setControllerMode(true)}
            aria-label="컨트롤러 모드로 전환"
          >
            <span className="icon"><ControllerIcon size={24} color="var(--text)" /></span>
            <span className="label">컨트롤러</span>
          </button>
        </footer>
      )}

      {state.isComplete && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onGoHome()}>
          <div className="modal-content complete-modal">
            <div className="modal-icon" style={{ fontSize: 56 }}>{collection.emoji}</div>
            <h2>타일 완료!</h2>
            <p className="puzzle-complete-name">{collection.name} #{tileNumber}</p>
            {/* 완성된 픽셀 아트 */}
            {state.puzzle && state.puzzle.solution && (() => {
              const size = state.puzzle.size;
              const color = size <= 5 ? '#22c55e' : size <= 8 ? '#6c5ce7' : size <= 10 ? '#a855f7' : '#f97316';
              const maxPx = 160;
              const cellPx = Math.floor(maxPx / size);
              const actualSize = cellPx * size;
              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
                  gridTemplateRows: `repeat(${size}, ${cellPx}px)`,
                  width: actualSize, height: actualSize,
                  borderRadius: 8, overflow: 'hidden',
                  margin: '0 auto 12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                }}>
                  {state.puzzle.solution.map((row, i) =>
                    row.map((cell, j) => (
                      <div key={`${i}-${j}`} style={{
                        width: cellPx, height: cellPx,
                        background: cell === 1 || cell > 0 ? color : 'var(--bg)',
                      }} />
                    ))
                  )}
                </div>
              );
            })()}
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
              <button className="primary-btn" onClick={onGoHome}>컬렉션으로 →</button>
            </div>
          </div>
        </div>
      )}

      {state.isGameOver && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onGoHome()}>
          <div className="modal-content game-over-modal">
            <div className="modal-icon" style={{ fontSize: 56 }}>💔</div>
            <h2>게임 오버</h2>
            <p className="game-over-desc">라이프를 모두 소진했어요</p>
            {!state.usedRevive && (
              <button className="revive-btn" onClick={() => { alert('광고 시청 완료! ❤️ 부활!'); handleRevive(); }}>
                <VideoIcon size={20} color="white" />
                <span>광고 보고 계속하기</span>
              </button>
            )}
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
