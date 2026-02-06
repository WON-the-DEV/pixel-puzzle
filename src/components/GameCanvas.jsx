import { useRef, useEffect, useCallback, useState } from 'react';
import { isRowComplete, isColComplete } from '../lib/puzzle.js';

const COLORS = {
  bg: '#ffffff',
  grid: '#e5e8eb',
  gridBold: '#8b95a1',
  cellFilled: '#191f28',
  clueText: '#191f28',
  clueComplete: '#b0b8c1',
  highlight: '#3182f6',
  highlightBg: 'rgba(49, 130, 246, 0.08)',
  mistakeBg: 'rgba(239, 68, 68, 0.15)',
  mistakeBorder: '#ef4444',
  autoXMark: '#3182f6',
};

const FONTS = {
  clue: 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif',
  clueSmall: 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif',
};

// 드래그 시작 최소 거리 (px)
const DRAG_THRESHOLD = 8;
// 싱글 탭 최대 시간 (ms)
const TAP_MAX_TIME = 300;

export default function GameCanvas({
  puzzle,
  playerGrid,
  mode,
  onToggleCell,
  onFillCell,
  onEndDrag,
  isComplete,
  showMistakes = false,
  autoXCells = [],
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
  });
  const highlightRef = useRef({ row: -1, col: -1 });
  const layoutRef = useRef(null);
  const autoXAnimRef = useRef(new Set());

  // Zoom/pan state for large puzzles
  const zoomRef = useRef({ scale: 1, offsetX: 0, offsetY: 0, isPinching: false, startDist: 0, startScale: 1 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const lastTapRef = useRef(0);

  const needsZoom = puzzle && puzzle.size >= 10;

  // Track auto X cells for animation
  useEffect(() => {
    if (autoXCells.length > 0) {
      autoXAnimRef.current = new Set(autoXCells.map(c => `${c.row}-${c.col}`));
      // Clear animation markers after animation duration
      const timer = setTimeout(() => {
        autoXAnimRef.current = new Set();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [autoXCells]);

  // Calculate layout based on puzzle size
  const getLayout = useCallback(() => {
    if (!puzzle) return null;
    const size = puzzle.size;

    const maxWidth = Math.min(window.innerWidth - 32, 468);
    const maxClueWidth = size <= 5 ? 50 : size <= 10 ? 60 : 70;
    const maxClueHeight = size <= 5 ? 50 : size <= 10 ? 60 : 70;
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

  // Render everything
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !puzzle || !playerGrid) return;
    const layout = getLayout();
    if (!layout) return;
    layoutRef.current = layout;

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

    const { row: hRow, col: hCol } = highlightRef.current;

    // Row highlight strip
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

    // Row clues (left side)
    puzzle.rowClues.forEach((clues, i) => {
      const complete = isRowComplete(puzzle.rowClues, playerGrid, i);
      const y = offsetY + i * cellSize + cellSize / 2;
      ctx.font = clues.length > 3 ? FONTS.clueSmall : FONTS.clue;
      ctx.fillStyle = complete ? COLORS.clueComplete : (i === hRow ? COLORS.highlight : COLORS.clueText);
      if (complete && i === hRow) ctx.fillStyle = COLORS.clueComplete;
      ctx.fillText(clues.join(' '), padding + clueWidth / 2, y);
    });

    // Col clues (top)
    puzzle.colClues.forEach((clues, j) => {
      const complete = isColComplete(puzzle.colClues, playerGrid, j);
      const x = offsetX + j * cellSize + cellSize / 2;
      ctx.font = clues.length > 3 ? FONTS.clueSmall : FONTS.clue;
      const baseColor = complete ? COLORS.clueComplete : (j === hCol ? COLORS.highlight : COLORS.clueText);
      ctx.fillStyle = complete && j === hCol ? COLORS.clueComplete : baseColor;
      clues.forEach((clue, k) => {
        const y = padding + clueHeight - (clues.length - k) * 16 + 8;
        ctx.fillText(clue.toString(), x, y);
      });
    });

    // ── Grid lines ──
    for (let i = 0; i <= size; i++) {
      const y = offsetY + i * cellSize;
      const x = offsetX + i * cellSize;
      const isBold = i % 5 === 0;

      ctx.strokeStyle = isBold ? COLORS.gridBold : COLORS.grid;
      ctx.lineWidth = isBold ? 2 : 1;

      // Horizontal
      ctx.beginPath();
      ctx.moveTo(offsetX, y);
      ctx.lineTo(offsetX + size * cellSize, y);
      ctx.stroke();

      // Vertical
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

        // Mistake highlighting
        if (showMistakes && !isComplete && cell !== 0) {
          const expected = puzzle.solution[i][j];
          const isMistake = (cell === 1 && expected === 0) || (cell === 2 && expected === 1);
          if (isMistake) {
            ctx.fillStyle = COLORS.mistakeBg;
            ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
            ctx.strokeStyle = COLORS.mistakeBorder;
            ctx.lineWidth = 2;
            ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
          }
        }

        if (cell === 1) {
          // Filled
          ctx.fillStyle = COLORS.cellFilled;
          const inset = Math.max(2, cellSize * 0.06);
          const r = Math.max(2, cellSize * 0.08);
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
        } else if (cell === 2) {
          // X mark
          const isAutoX = animatingAutoX.has(`${i}-${j}`);
          ctx.strokeStyle = isAutoX ? COLORS.autoXMark : COLORS.clueComplete;
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
  }, [puzzle, playerGrid, getLayout, showMistakes, isComplete, autoXCells]);

  // Render on state changes
  useEffect(() => {
    render();
  }, [render]);

  // Resize handler
  useEffect(() => {
    const onResize = () => render();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [render]);

  // Get cell from pointer position (accounting for zoom)
  const getCellAt = useCallback((clientX, clientY) => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return null;
    const rect = canvas.getBoundingClientRect();

    // Account for CSS transform (zoom/pan)
    const zoom = zoomRef.current;
    const wrapper = wrapperRef.current;
    let x, y;

    if (wrapper && needsZoom) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const rawX = clientX - wrapperRect.left;
      const rawY = clientY - wrapperRect.top;
      x = rawX / zoom.scale - zoom.offsetX;
      y = rawY / zoom.scale - zoom.offsetY;
    } else {
      x = clientX - rect.left;
      y = clientY - rect.top;
    }

    const col = Math.floor((x - layout.offsetX) / layout.cellSize);
    const row = Math.floor((y - layout.offsetY) / layout.cellSize);
    if (row >= 0 && row < layout.size && col >= 0 && col < layout.size) {
      return { row, col };
    }
    return null;
  }, [needsZoom]);

  // ── Touch handlers for zoom/pan (wrapper level) ──
  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleWrapperTouchStart = useCallback((e) => {
    if (!needsZoom) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      zoomRef.current.isPinching = true;
      zoomRef.current.startDist = dist;
      zoomRef.current.startScale = zoomRef.current.scale;
      interactionRef.current.isDown = false;
      interactionRef.current.isDragging = false;
      clearLongPressTimer();
    } else if (e.touches.length === 1 && zoomRef.current.scale > 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        zoomRef.current = { scale: 1, offsetX: 0, offsetY: 0, isPinching: false, startDist: 0, startScale: 1 };
        setZoomLevel(1);
        applyTransform();
        lastTapRef.current = 0;
        e.preventDefault();
        return;
      }
      lastTapRef.current = now;
    }
  }, [needsZoom]);

  const handleWrapperTouchMove = useCallback((e) => {
    if (!needsZoom) return;
    const zoom = zoomRef.current;

    if (zoom.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const newScale = Math.max(1, Math.min(3, zoom.startScale * (dist / zoom.startDist)));
      zoom.scale = newScale;
      setZoomLevel(newScale);
      applyTransform();
    }
  }, [needsZoom]);

  const handleWrapperTouchEnd = useCallback((e) => {
    if (!needsZoom) return;
    zoomRef.current.isPinching = false;

    if (zoomRef.current.scale < 1.1) {
      zoomRef.current = { scale: 1, offsetX: 0, offsetY: 0, isPinching: false, startDist: 0, startScale: 1 };
      setZoomLevel(1);
      applyTransform();
    }
  }, [needsZoom]);

  const applyTransform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const zoom = zoomRef.current;
    canvas.style.transform = zoom.scale > 1
      ? `scale(${zoom.scale})`
      : '';
    canvas.style.transformOrigin = 'center center';
  }, []);

  const clearLongPressTimer = () => {
    if (interactionRef.current.longPressTimer) {
      clearTimeout(interactionRef.current.longPressTimer);
      interactionRef.current.longPressTimer = null;
    }
  };

  // ── Pointer handlers with proper single-tap and drag detection ──
  const handlePointerDown = useCallback(
    (e) => {
      if (isComplete) return;
      if (zoomRef.current.isPinching) return;
      const touch = e.touches ? e.touches[0] : e;
      if (e.touches && e.touches.length > 1) return;
      if (e.touches) e.preventDefault();

      const cell = getCellAt(touch.clientX, touch.clientY);
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

      highlightRef.current = { row: cell.row, col: cell.col };
      render();
    },
    [getCellAt, isComplete, render]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (zoomRef.current.isPinching) return;
      const touch = e.touches ? e.touches[0] : e;
      if (e.touches && e.touches.length > 1) return;
      if (e.touches) e.preventDefault();

      const interaction = interactionRef.current;
      const cell = getCellAt(touch.clientX, touch.clientY);

      if (cell) {
        highlightRef.current = { row: cell.row, col: cell.col };
      } else {
        highlightRef.current = { row: -1, col: -1 };
      }

      if (interaction.isDown && !interaction.isDragging) {
        // Check if we've moved enough to start dragging
        const dx = touch.clientX - interaction.startX;
        const dy = touch.clientY - interaction.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= DRAG_THRESHOLD) {
          // Start drag! First, apply the initial cell
          interaction.isDragging = true;
          clearLongPressTimer();
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

      render();
    },
    [getCellAt, onFillCell, onToggleCell, render, isComplete, playerGrid, mode]
  );

  const handlePointerUp = useCallback(
    (e) => {
      const interaction = interactionRef.current;
      clearLongPressTimer();

      if (interaction.isDown && !interaction.isDragging) {
        // This was a single tap (no drag detected)
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

      highlightRef.current = { row: -1, col: -1 };
      render();
    },
    [onEndDrag, onToggleCell, render, isComplete]
  );

  return (
    <div
      ref={wrapperRef}
      className={`canvas-wrapper ${needsZoom ? 'zoomable' : ''}`}
      onTouchStart={handleWrapperTouchStart}
      onTouchMove={handleWrapperTouchMove}
      onTouchEnd={handleWrapperTouchEnd}
    >
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
      {needsZoom && zoomLevel > 1.05 && (
        <div className="zoom-indicator">{Math.round(zoomLevel * 100)}%</div>
      )}
    </div>
  );
}
