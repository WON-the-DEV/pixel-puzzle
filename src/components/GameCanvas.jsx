import { useRef, useEffect, useCallback } from 'react';
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
};

const FONTS = {
  clue: 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif',
  clueSmall: 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif',
};

export default function GameCanvas({
  puzzle,
  playerGrid,
  mode,
  onToggleCell,
  onFillCell,
  onEndDrag,
  isComplete,
}) {
  const canvasRef = useRef(null);
  const dragRef = useRef({ isDragging: false, dragValue: null });
  const highlightRef = useRef({ row: -1, col: -1 });
  const layoutRef = useRef(null);

  // Calculate layout based on puzzle size
  const getLayout = useCallback(() => {
    if (!puzzle) return null;
    const size = puzzle.size;

    // Responsive cell size
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
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const cell = playerGrid[i][j];
        const x = offsetX + j * cellSize;
        const y = offsetY + i * cellSize;

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
  }, [puzzle, playerGrid, getLayout]);

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

  // Get cell from pointer position
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

  // Pointer handlers
  const handlePointerDown = useCallback(
    (e) => {
      if (isComplete) return;
      const touch = e.touches ? e.touches[0] : e;
      if (e.touches) e.preventDefault();
      const cell = getCellAt(touch.clientX, touch.clientY);
      if (cell) {
        onToggleCell(cell.row, cell.col);
        // We need to figure out the drag value after toggle.
        // Since state is async, we determine it from current:
        const current = playerGrid[cell.row][cell.col];
        const newVal = mode === 'fill' ? (current === 1 ? 0 : 1) : (current === 2 ? 0 : 2);
        dragRef.current = { isDragging: true, dragValue: newVal };
        highlightRef.current = { row: cell.row, col: cell.col };
      }
    },
    [getCellAt, onToggleCell, playerGrid, mode, isComplete]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const touch = e.touches ? e.touches[0] : e;
      if (e.touches) e.preventDefault();
      const cell = getCellAt(touch.clientX, touch.clientY);
      if (cell) {
        highlightRef.current = { row: cell.row, col: cell.col };
        if (dragRef.current.isDragging && dragRef.current.dragValue !== null && !isComplete) {
          onFillCell(cell.row, cell.col, dragRef.current.dragValue);
        }
      } else {
        highlightRef.current = { row: -1, col: -1 };
      }
      render();
    },
    [getCellAt, onFillCell, render, isComplete]
  );

  const handlePointerUp = useCallback(() => {
    if (dragRef.current.isDragging) {
      dragRef.current = { isDragging: false, dragValue: null };
      onEndDrag();
    }
    highlightRef.current = { row: -1, col: -1 };
    render();
  }, [onEndDrag, render]);

  return (
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
  );
}
