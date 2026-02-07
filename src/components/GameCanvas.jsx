import { useRef, useEffect, useCallback, useState } from 'react';
import { isRowComplete, isColComplete } from '../lib/puzzle.js';
import { getSetting } from '../lib/settings.js';

const TOUCH_OFFSET_Y = -30; // pixels above finger

function getColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    bg: isDark ? '#1a1a2e' : '#ffffff',
    grid: isDark ? '#3a3a4e' : '#E5E7EB',
    gridBold: isDark ? '#64748B' : '#9CA3AF',
    cellFilled: isDark ? '#e0e0e0' : '#1B2838',
    clueText: isDark ? '#d0d0d0' : '#1A1A2E',
    clueComplete: isDark ? '#475569' : '#D1D5DB',
    highlight: '#6C5CE7',
    highlightBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(108, 92, 231, 0.08)',
    touchHighlightBg: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(108, 92, 231, 0.05)',
    completedRowBg: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.10)',
    mistakeBg: 'rgba(239, 68, 68, 0.25)',
    mistakeBorder: isDark ? '#ff6b6b' : '#ef4444',
    autoXMark: '#6C5CE7',
    xMark: isDark ? '#888888' : '#C0C4CC',
    cursorBorder: '#FF6B6B',
    cursorBg: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 107, 107, 0.12)',
  };
}

const DRAG_THRESHOLD = 8;

export default function GameCanvas({
  puzzle,
  playerGrid,
  mode,
  onToggleCell,
  onFillCell,
  onEndDrag,
  isComplete,
  autoXCells = [],
  mistakeFlashCells = [],
  controllerMode = false,
  cursorRow = 0,
  cursorCol = 0,
  darkMode = false,
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const interactionRef = useRef({
    isDown: false,
    isDragging: false,
    dragValue: null,
    startCell: null,
    startTime: 0,
    startX: 0,
    startY: 0,
    longPressTimer: null,
    isLongPress: false,
    dragDirection: null, // 'horizontal' | 'vertical' | null — locked after first drag move
    isTouch: false, // whether current interaction is touch (for offset)
  });
  const highlightRef = useRef({ row: -1, col: -1 });
  const lastTouchRef = useRef({ row: -1, col: -1 });
  const layoutRef = useRef(null);
  const autoXAnimRef = useRef(new Set());
  // mistakeFlashRef removed — wrong cells use permanent red X (cell value 3)
  const touchOffsetActiveRef = useRef(false); // true when touch offset crosshair is visible
  const rafRef = useRef(null); // requestAnimationFrame id for batched rendering
  const renderRef = useRef(null); // always points to latest render function

  // Mistake flash removed — wrong cells are permanently red X (cell value 3)

  useEffect(() => {
    if (autoXCells.length > 0) {
      autoXAnimRef.current = new Set(autoXCells.map(c => `${c.row}-${c.col}`));
      const timer = setTimeout(() => {
        autoXAnimRef.current = new Set();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoXCells]);

  const getLayout = useCallback(() => {
    if (!puzzle) return null;
    const size = puzzle.size;

    // Maximize puzzle area — use nearly full screen width
    const screenWidth = window.innerWidth;
    const maxWidth = Math.min(screenWidth - 16, 500);

    // Dynamic clue sizing based on max clue length — tighter for simple puzzles
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
      // 15x15: dynamic clue width based on actual max clue length
      const perNum = Math.max(8, Math.min(11, Math.floor(maxWidth / (size + maxRowClueLen * 2))));
      clueWidth = Math.min(72, maxRowClueLen * perNum + 6);
      clueHeight = Math.min(68, maxColClueLen * 10 + 6);
    }

    const padding = 4;
    const availableWidth = maxWidth - clueWidth - padding * 2;
    const cellSize = Math.floor(availableWidth / size);

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

    const COLORS = getColors();
    const { size, cellSize, clueWidth, clueHeight, padding, width, height, offsetX, offsetY } = layout;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);

    // In controller mode, use cursor position for highlight
    const hRow = controllerMode ? cursorRow : highlightRef.current.row;
    const hCol = controllerMode ? cursorCol : highlightRef.current.col;
    // Touch mode last-touch highlight (persistent, lighter)
    const ltRow = lastTouchRef.current.row;
    const ltCol = lastTouchRef.current.col;

    // Completed row/col background tint
    for (let i = 0; i < size; i++) {
      if (isRowComplete(puzzle.rowClues, playerGrid, i)) {
        ctx.fillStyle = COLORS.completedRowBg;
        ctx.fillRect(0, offsetY + i * cellSize, width, cellSize);
      }
    }
    for (let j = 0; j < size; j++) {
      if (isColComplete(puzzle.colClues, playerGrid, j)) {
        ctx.fillStyle = COLORS.completedRowBg;
        ctx.fillRect(offsetX + j * cellSize, 0, cellSize, height);
      }
    }

    // Touch mode last-touch highlight (lighter than controller)
    if (!controllerMode && hRow < 0 && ltRow >= 0) {
      ctx.fillStyle = COLORS.touchHighlightBg;
      ctx.fillRect(0, offsetY + ltRow * cellSize, width, cellSize);
    }
    if (!controllerMode && hCol < 0 && ltCol >= 0) {
      ctx.fillStyle = COLORS.touchHighlightBg;
      ctx.fillRect(offsetX + ltCol * cellSize, 0, cellSize, height);
    }

    // Row highlight strip (active touch/controller)
    if (hRow >= 0) {
      ctx.fillStyle = COLORS.highlightBg;
      ctx.fillRect(0, offsetY + hRow * cellSize, width, cellSize);
    }
    // Col highlight strip
    if (hCol >= 0) {
      ctx.fillStyle = COLORS.highlightBg;
      ctx.fillRect(offsetX + hCol * cellSize, 0, cellSize, height);
    }

    // ── Clues ──
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let clueFontSize;
    if (size <= 5) clueFontSize = 12;
    else if (size <= 8) clueFontSize = 11;
    else if (size <= 10) clueFontSize = 10;
    else clueFontSize = Math.max(8, Math.min(9, cellSize * 0.45));
    const fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
    const clueFont = `bold ${clueFontSize}px ${fontFamily}`;

    // Font for highlighted clues (slightly larger in controller mode)
    const highlightClueFontSize = controllerMode ? Math.min(clueFontSize + 1, 14) : clueFontSize;
    const highlightClueFont = `900 ${highlightClueFontSize}px ${fontFamily}`;

    // Row clues (left side)
    puzzle.rowClues.forEach((clues, i) => {
      const complete = isRowComplete(puzzle.rowClues, playerGrid, i);
      const isHighlighted = i === hRow && !complete;
      const y = offsetY + i * cellSize + cellSize / 2;
      ctx.font = isHighlighted ? highlightClueFont : clueFont;
      if (complete) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#aaaaaa';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = isHighlighted ? COLORS.highlight : COLORS.clueText;
      }
      // For 15x15, use narrower spacing between numbers
      const separator = size >= 15 ? '\u2009' : ' '; // thin space for 15x15
      ctx.fillText(clues.join(separator), padding + clueWidth / 2, y);
      ctx.globalAlpha = 1.0;
    });

    // Col clues (top)
    const colClueLineHeight = size >= 15 ? Math.min(12, cellSize * 0.55) : Math.min(15, cellSize * 0.65);
    puzzle.colClues.forEach((clues, j) => {
      const complete = isColComplete(puzzle.colClues, playerGrid, j);
      const isHighlighted = j === hCol && !complete;
      const x = offsetX + j * cellSize + cellSize / 2;
      ctx.font = isHighlighted ? highlightClueFont : clueFont;
      if (complete) {
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#aaaaaa';
      } else {
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = isHighlighted ? COLORS.highlight : COLORS.clueText;
      }
      clues.forEach((clue, k) => {
        const y = padding + clueHeight - (clues.length - k) * colClueLineHeight + colClueLineHeight / 2;
        ctx.fillText(clue.toString(), x, y);
      });
      ctx.globalAlpha = 1.0;
    });

    // ── Grid lines ──
    for (let i = 0; i <= size; i++) {
      const y = offsetY + i * cellSize;
      const x = offsetX + i * cellSize;
      const isBold = i % 5 === 0;

      ctx.strokeStyle = isBold ? COLORS.gridBold : COLORS.grid;
      ctx.lineWidth = isBold ? 1.5 : 0.5;

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
    const animatingAutoX = autoXAnimRef.current;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const cell = playerGrid[i][j];
        const x = offsetX + j * cellSize;
        const y = offsetY + i * cellSize;
        const key = `${i}-${j}`;

        if (cell === 1) {
          ctx.fillStyle = COLORS.cellFilled;
          const inset = Math.max(1.5, cellSize * 0.06);
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
        } else if (cell === 2 || cell === 3) {
          const isAutoX = animatingAutoX.has(key);
          const isMistake = cell === 3;
          ctx.strokeStyle = isMistake ? COLORS.mistakeBorder : COLORS.xMark;
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

    // ── Controller mode cursor ──
    if (controllerMode && cursorRow >= 0 && cursorRow < size && cursorCol >= 0 && cursorCol < size) {
      const cx = offsetX + cursorCol * cellSize;
      const cy = offsetY + cursorRow * cellSize;

      // Cursor background highlight
      ctx.fillStyle = COLORS.cursorBg;
      ctx.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);

      // Thick border
      ctx.strokeStyle = COLORS.cursorBorder;
      ctx.lineWidth = 3;
      ctx.strokeRect(cx + 1.5, cy + 1.5, cellSize - 3, cellSize - 3);
    }

    // (crosshair indicator removed)
  }, [puzzle, playerGrid, getLayout, isComplete, autoXCells, controllerMode, cursorRow, cursorCol, darkMode]);

  // Keep renderRef always pointing to latest render function
  renderRef.current = render;

  // Batched render via requestAnimationFrame — always uses latest render via ref
  const scheduleRender = useCallback(() => {
    if (rafRef.current) return; // already scheduled
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      if (renderRef.current) renderRef.current();
    });
  }, []);

  useEffect(() => {
    render();
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [render]);

  useEffect(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  // Listen for theme changes
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

  const clearLongPressTimer = () => {
    if (interactionRef.current.longPressTimer) {
      clearTimeout(interactionRef.current.longPressTimer);
      interactionRef.current.longPressTimer = null;
    }
  };

  const handlePointerDown = useCallback(
    (e) => {
      if (isComplete || controllerMode) return;
      const isTouch = !!e.touches;
      const touch = isTouch ? e.touches[0] : e;
      if (isTouch && e.touches.length > 1) return;
      if (e.type === 'touchstart') e.preventDefault();

      // Apply touch offset when setting enabled
      const useOffset = isTouch && getSetting('touchOffset');
      const clientY = useOffset ? touch.clientY + TOUCH_OFFSET_Y : touch.clientY;
      const cell = getCellAt(touch.clientX, clientY);

      if (!cell) return;

      const interaction = interactionRef.current;
      interaction.isDown = true;
      interaction.isDragging = false;
      interaction.startCell = cell;
      interaction.startTime = Date.now();
      interaction.startX = touch.clientX;
      interaction.startY = touch.clientY;
      interaction.dragValue = null;
      interaction.isLongPress = false;
      interaction.dragDirection = null;
      interaction.isTouch = isTouch;

      touchOffsetActiveRef.current = useOffset;
      highlightRef.current = { row: cell.row, col: cell.col };
      lastTouchRef.current = { row: cell.row, col: cell.col };
      scheduleRender();
    },
    [getCellAt, isComplete, scheduleRender, controllerMode]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (controllerMode) return;
      const isTouch = !!e.touches;
      const touch = isTouch ? e.touches[0] : e;
      if (isTouch && e.touches.length > 1) return;
      if (e.type === 'touchmove') e.preventDefault();

      const interaction = interactionRef.current;
      const useOffset = isTouch && touchOffsetActiveRef.current;
      const clientY = useOffset ? touch.clientY + TOUCH_OFFSET_Y : touch.clientY;
      const cell = getCellAt(touch.clientX, clientY);

      if (cell) {
        // During drag, constrain highlight to locked direction
        const interaction = interactionRef.current;
        if (interaction.isDragging && interaction.dragDirection && interaction.startCell) {
          if (interaction.dragDirection === 'horizontal') {
            highlightRef.current = { row: interaction.startCell.row, col: cell.col };
          } else {
            highlightRef.current = { row: cell.row, col: interaction.startCell.col };
          }
        } else {
          highlightRef.current = { row: cell.row, col: cell.col };
        }
      } else {
        highlightRef.current = { row: -1, col: -1 };
      }

      if (interaction.isDown && !interaction.isDragging) {
        const dx = touch.clientX - interaction.startX;
        const dy = touch.clientY - interaction.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= DRAG_THRESHOLD) {
          interaction.isDragging = true;
          clearLongPressTimer();

          // Detect drag direction from start cell to current cell
          if (cell && interaction.startCell) {
            const dRow = Math.abs(cell.row - interaction.startCell.row);
            const dCol = Math.abs(cell.col - interaction.startCell.col);
            if (dRow > dCol) interaction.dragDirection = 'vertical';
            else if (dCol > dRow) interaction.dragDirection = 'horizontal';
            else {
              // Equal or same cell — detect from pixel movement
              interaction.dragDirection = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
            }
          }

          const startCell = interaction.startCell;
          if (startCell && !isComplete) {
            const current = playerGrid[startCell.row][startCell.col];
            const fillVal = mode === 'fill' ? (current === 1 ? 0 : 1) : (current === 2 ? 0 : 2);
            interaction.dragValue = fillVal;
            onToggleCell(startCell.row, startCell.col);
          }
        }
      }

      if (interaction.isDragging && interaction.dragValue !== null && cell && !isComplete) {
        onFillCell(cell.row, cell.col, interaction.dragValue);
      }

      scheduleRender();
    },
    [getCellAt, onFillCell, onToggleCell, scheduleRender, isComplete, playerGrid, mode, controllerMode]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (controllerMode) return;
      if (e.type === 'touchend') e.stopPropagation();

      const interaction = interactionRef.current;
      clearLongPressTimer();

      if (interaction.isDown && !interaction.isDragging) {
        // Single tap — toggle the cell we started on
        const cell = interaction.startCell;
        if (cell && !isComplete) {
          onToggleCell(cell.row, cell.col);
        }
      }

      if (interaction.isDragging) {
        onEndDrag();
      }

      interaction.isDown = false;
      interaction.isDragging = false;
      interaction.dragValue = null;
      interaction.startCell = null;
      interaction.isLongPress = false;
      interaction.dragDirection = null;
      interaction.isTouch = false;

      touchOffsetActiveRef.current = false;
      highlightRef.current = { row: -1, col: -1 };
      scheduleRender();
    },
    [onEndDrag, onToggleCell, scheduleRender, isComplete, controllerMode]
  );

  // Register native touch listeners (non-passive) to fix mobile single-tap
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
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
      />
    </div>
  );
}
