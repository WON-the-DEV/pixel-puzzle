import { useRef, useEffect, useCallback, useState } from 'react';
import { isRowComplete, isColComplete } from '../lib/puzzle.js';

function getColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    bg: isDark ? '#1E2A45' : '#ffffff',
    grid: isDark ? '#2D3A56' : '#E5E7EB',
    gridBold: isDark ? '#64748B' : '#9CA3AF',
    cellFilled: isDark ? '#E2E8F0' : '#1B2838',
    clueText: isDark ? '#E2E8F0' : '#1A1A2E',
    clueComplete: isDark ? '#475569' : '#D1D5DB',
    highlight: '#6C5CE7',
    highlightBg: isDark ? 'rgba(124, 108, 240, 0.12)' : 'rgba(108, 92, 231, 0.08)',
    completedRowBg: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.10)',
    mistakeBg: 'rgba(239, 68, 68, 0.25)',
    mistakeBorder: '#ef4444',
    autoXMark: '#6C5CE7',
    xMark: isDark ? '#64748B' : '#C0C4CC',
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
  const mistakeFlashRef = useRef(new Set());

  // Zoom/pan state for large puzzles
  const zoomRef = useRef({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    isPinching: false,
    startDist: 0,
    startScale: 1,
    startMidX: 0,
    startMidY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
    // For single-finger panning when zoomed
    isPanning: false,
    panStartX: 0,
    panStartY: 0,
    panStartOffsetX: 0,
    panStartOffsetY: 0,
  });
  const [zoomLevel, setZoomLevel] = useState(1);

  const needsZoom = puzzle && puzzle.size >= 10;

  // Mistake flash animation
  useEffect(() => {
    if (mistakeFlashCells && mistakeFlashCells.length > 0) {
      mistakeFlashRef.current = new Set(mistakeFlashCells.map(c => `${c.row}-${c.col}`));
      const timer = setTimeout(() => {
        mistakeFlashRef.current = new Set();
        // Re-render to clear flash
        requestAnimationFrame(() => render());
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mistakeFlashCells]);

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
      clueWidth = Math.min(62, maxRowClueLen * 11 + 8);
      clueHeight = Math.min(62, maxColClueLen * 11 + 8);
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

    const { row: hRow, col: hCol } = highlightRef.current;

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

    const baseFontSize = cellSize <= 20 ? 10 : cellSize <= 28 ? 12 : 14;
    const smallFontSize = Math.max(8, baseFontSize - 3);
    const fontFamily = '-apple-system, BlinkMacSystemFont, sans-serif';
    const clueFont = `bold ${baseFontSize}px ${fontFamily}`;
    const clueFontSmall = `bold ${smallFontSize}px ${fontFamily}`;

    // Row clues (left side)
    puzzle.rowClues.forEach((clues, i) => {
      const complete = isRowComplete(puzzle.rowClues, playerGrid, i);
      const y = offsetY + i * cellSize + cellSize / 2;
      ctx.font = clues.length > 3 ? clueFontSmall : clueFont;
      ctx.fillStyle = complete ? COLORS.clueComplete : (i === hRow ? COLORS.highlight : COLORS.clueText);
      if (complete && i === hRow) ctx.fillStyle = COLORS.clueComplete;
      ctx.fillText(clues.join(' '), padding + clueWidth / 2, y);
    });

    // Col clues (top)
    const colClueLineHeight = Math.min(15, cellSize * 0.65);
    puzzle.colClues.forEach((clues, j) => {
      const complete = isColComplete(puzzle.colClues, playerGrid, j);
      const x = offsetX + j * cellSize + cellSize / 2;
      ctx.font = clues.length > 3 ? clueFontSmall : clueFont;
      const baseColor = complete ? COLORS.clueComplete : (j === hCol ? COLORS.highlight : COLORS.clueText);
      ctx.fillStyle = complete && j === hCol ? COLORS.clueComplete : baseColor;
      clues.forEach((clue, k) => {
        const y = padding + clueHeight - (clues.length - k) * colClueLineHeight + colClueLineHeight / 2;
        ctx.fillText(clue.toString(), x, y);
      });
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
    const flashingMistakes = mistakeFlashRef.current;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const cell = playerGrid[i][j];
        const x = offsetX + j * cellSize;
        const y = offsetY + i * cellSize;
        const key = `${i}-${j}`;

        // Mistake flash effect (red background)
        if (flashingMistakes.has(key)) {
          ctx.fillStyle = COLORS.mistakeBg;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = COLORS.mistakeBorder;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
        }

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
        } else if (cell === 2) {
          const isAutoX = animatingAutoX.has(key);
          const isMistakeFlash = flashingMistakes.has(key);
          ctx.strokeStyle = isMistakeFlash ? COLORS.mistakeBorder : isAutoX ? COLORS.autoXMark : COLORS.xMark;
          ctx.lineWidth = isMistakeFlash ? 2.5 : 2;
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
  }, [puzzle, playerGrid, getLayout, isComplete, autoXCells, mistakeFlashCells]);

  useEffect(() => {
    render();
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

    const zoom = zoomRef.current;
    const wrapper = wrapperRef.current;
    let x, y;

    if (wrapper && needsZoom && zoom.scale > 1) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const rawX = clientX - wrapperRect.left;
      const rawY = clientY - wrapperRect.top;
      // Reverse the transform: translate then scale
      x = (rawX - zoom.offsetX) / zoom.scale;
      y = (rawY - zoom.offsetY) / zoom.scale;
    } else {
      const rect = canvas.getBoundingClientRect();
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

  const getTouchDist = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchMid = (touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const clampOffset = useCallback(() => {
    const zoom = zoomRef.current;
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const wRect = wrapper.getBoundingClientRect();
    const cW = canvas.offsetWidth * zoom.scale;
    const cH = canvas.offsetHeight * zoom.scale;

    // Allow panning so the canvas edges stay within or at the wrapper edges
    if (cW <= wRect.width) {
      zoom.offsetX = (wRect.width - cW) / 2;
    } else {
      zoom.offsetX = Math.min(0, Math.max(wRect.width - cW, zoom.offsetX));
    }

    if (cH <= wRect.height) {
      zoom.offsetY = (wRect.height - cH) / 2;
    } else {
      zoom.offsetY = Math.min(0, Math.max(wRect.height - cH, zoom.offsetY));
    }
  }, []);

  const applyTransform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const zoom = zoomRef.current;
    if (zoom.scale > 1) {
      canvas.style.transform = `translate(${zoom.offsetX}px, ${zoom.offsetY}px) scale(${zoom.scale})`;
      canvas.style.transformOrigin = '0 0';
    } else {
      canvas.style.transform = '';
      canvas.style.transformOrigin = 'center center';
    }
  }, []);

  const handleWrapperTouchStart = useCallback((e) => {
    if (!needsZoom) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const mid = getTouchMid(e.touches);
      const zoom = zoomRef.current;
      zoom.isPinching = true;
      zoom.startDist = dist;
      zoom.startScale = zoom.scale;
      zoom.startMidX = mid.x;
      zoom.startMidY = mid.y;
      zoom.startOffsetX = zoom.offsetX;
      zoom.startOffsetY = zoom.offsetY;
      interactionRef.current.isDown = false;
      interactionRef.current.isDragging = false;
      clearLongPressTimer();
    }
  }, [needsZoom]);

  const handleWrapperTouchMove = useCallback((e) => {
    if (!needsZoom) return;
    const zoom = zoomRef.current;

    if (zoom.isPinching && e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDist(e.touches);
      const mid = getTouchMid(e.touches);
      const newScale = Math.max(1, Math.min(4, zoom.startScale * (dist / zoom.startDist)));

      // Zoom towards pinch midpoint
      const wrapper = wrapperRef.current;
      if (wrapper) {
        const wRect = wrapper.getBoundingClientRect();
        const midLocalX = mid.x - wRect.left;
        const midLocalY = mid.y - wRect.top;

        // The point under the midpoint in canvas-local coords at start of pinch
        const startMidLocalX = zoom.startMidX - wRect.left;
        const startMidLocalY = zoom.startMidY - wRect.top;
        const canvasX = (startMidLocalX - zoom.startOffsetX) / zoom.startScale;
        const canvasY = (startMidLocalY - zoom.startOffsetY) / zoom.startScale;

        // New offset so the same canvas point stays under the new midpoint
        zoom.offsetX = midLocalX - canvasX * newScale;
        zoom.offsetY = midLocalY - canvasY * newScale;
      }

      zoom.scale = newScale;
      clampOffset();
      setZoomLevel(newScale);
      applyTransform();
    }
  }, [needsZoom, clampOffset, applyTransform]);

  const handleWrapperTouchEnd = useCallback((e) => {
    if (!needsZoom) return;
    const zoom = zoomRef.current;
    zoom.isPinching = false;

    if (zoom.scale < 1.1) {
      zoom.scale = 1;
      zoom.offsetX = 0;
      zoom.offsetY = 0;
      setZoomLevel(1);
      applyTransform();
    }
  }, [needsZoom, applyTransform]);

  const clearLongPressTimer = () => {
    if (interactionRef.current.longPressTimer) {
      clearTimeout(interactionRef.current.longPressTimer);
      interactionRef.current.longPressTimer = null;
    }
  };

  const handlePointerDown = useCallback(
    (e) => {
      if (isComplete) return;
      const zoom = zoomRef.current;
      if (zoom.isPinching) return;
      const touch = e.touches ? e.touches[0] : e;
      if (e.touches && e.touches.length > 1) return;
      if (e.type === 'touchstart') e.preventDefault();

      // When zoomed, detect if this is a pan start (not on a cell) or cell interaction
      const cell = getCellAt(touch.clientX, touch.clientY);

      if (needsZoom && zoom.scale > 1) {
        // Start potential pan
        zoom.isPanning = false;
        zoom.panStartX = touch.clientX;
        zoom.panStartY = touch.clientY;
        zoom.panStartOffsetX = zoom.offsetX;
        zoom.panStartOffsetY = zoom.offsetY;
      }

      if (!cell) {
        // If no cell hit but zoomed, start panning immediately
        if (needsZoom && zoom.scale > 1) {
          zoom.isPanning = true;
        }
        return;
      }

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
    [getCellAt, isComplete, render, needsZoom]
  );

  const handlePointerMove = useCallback(
    (e) => {
      const zoom = zoomRef.current;
      if (zoom.isPinching) return;
      const touch = e.touches ? e.touches[0] : e;
      if (e.touches && e.touches.length > 1) return;
      if (e.type === 'touchmove') e.preventDefault();

      // Handle panning when zoomed
      if (needsZoom && zoom.scale > 1) {
        const dx = touch.clientX - zoom.panStartX;
        const dy = touch.clientY - zoom.panStartY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (zoom.isPanning || (interactionRef.current.isDown && dist > DRAG_THRESHOLD * 2)) {
          // Switch to panning mode
          if (!zoom.isPanning) {
            zoom.isPanning = true;
            interactionRef.current.isDown = false;
            interactionRef.current.isDragging = false;
            highlightRef.current = { row: -1, col: -1 };
          }
          zoom.offsetX = zoom.panStartOffsetX + dx;
          zoom.offsetY = zoom.panStartOffsetY + dy;
          clampOffset();
          applyTransform();
          render();
          return;
        }
      }

      const interaction = interactionRef.current;
      const cell = getCellAt(touch.clientX, touch.clientY);

      if (cell) {
        highlightRef.current = { row: cell.row, col: cell.col };
      } else {
        highlightRef.current = { row: -1, col: -1 };
      }

      if (interaction.isDown && !interaction.isDragging && !(needsZoom && zoom.scale > 1)) {
        const dx = touch.clientX - interaction.startX;
        const dy = touch.clientY - interaction.startY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= DRAG_THRESHOLD) {
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
    [getCellAt, onFillCell, onToggleCell, render, isComplete, playerGrid, mode, needsZoom, clampOffset, applyTransform]
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (e.type === 'touchend') e.stopPropagation();

      const zoom = zoomRef.current;
      const interaction = interactionRef.current;
      clearLongPressTimer();

      // If we were panning, just stop
      if (zoom.isPanning) {
        zoom.isPanning = false;
        interaction.isDown = false;
        interaction.isDragging = false;
        interaction.dragValue = null;
        interaction.startCell = null;
        return;
      }

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

      highlightRef.current = { row: -1, col: -1 };
      render();
    },
    [onEndDrag, onToggleCell, render, isComplete]
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

  // Double-tap to reset zoom
  const lastTapRef = useRef(0);
  useEffect(() => {
    if (!needsZoom) return;
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleDoubleTap = (e) => {
      if (e.touches && e.touches.length !== 1) return;
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double tap detected
        const zoom = zoomRef.current;
        if (zoom.scale > 1.1) {
          // Reset zoom
          zoom.scale = 1;
          zoom.offsetX = 0;
          zoom.offsetY = 0;
          setZoomLevel(1);
          applyTransform();
        } else {
          // Zoom in to 2x at tap point
          const touch = e.touches ? e.touches[0] : e;
          const wRect = wrapper.getBoundingClientRect();
          const tapX = touch.clientX - wRect.left;
          const tapY = touch.clientY - wRect.top;
          const canvasX = tapX / zoom.scale;
          const canvasY = tapY / zoom.scale;
          zoom.scale = 2;
          zoom.offsetX = tapX - canvasX * 2;
          zoom.offsetY = tapY - canvasY * 2;
          clampOffset();
          setZoomLevel(2);
          applyTransform();
        }
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }
    };

    // Use a separate handler for double-tap detection on the wrapper
    // We don't preventDefault here to avoid interfering with single taps
    wrapper.addEventListener('touchend', handleDoubleTap, { passive: true });
    return () => wrapper.removeEventListener('touchend', handleDoubleTap);
  }, [needsZoom, applyTransform, clampOffset]);

  const handleZoomIn = useCallback(() => {
    const zoom = zoomRef.current;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const wRect = wrapper.getBoundingClientRect();
    const centerX = wRect.width / 2;
    const centerY = wRect.height / 2;
    const canvasX = (centerX - zoom.offsetX) / zoom.scale;
    const canvasY = (centerY - zoom.offsetY) / zoom.scale;
    const newScale = Math.min(4, zoom.scale + 0.5);
    zoom.scale = newScale;
    zoom.offsetX = centerX - canvasX * newScale;
    zoom.offsetY = centerY - canvasY * newScale;
    clampOffset();
    setZoomLevel(newScale);
    applyTransform();
  }, [clampOffset, applyTransform]);

  const handleZoomOut = useCallback(() => {
    const zoom = zoomRef.current;
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const wRect = wrapper.getBoundingClientRect();
    const centerX = wRect.width / 2;
    const centerY = wRect.height / 2;
    const canvasX = (centerX - zoom.offsetX) / zoom.scale;
    const canvasY = (centerY - zoom.offsetY) / zoom.scale;
    const newScale = Math.max(1, zoom.scale - 0.5);
    zoom.scale = newScale;
    if (newScale <= 1) {
      zoom.offsetX = 0;
      zoom.offsetY = 0;
    } else {
      zoom.offsetX = centerX - canvasX * newScale;
      zoom.offsetY = centerY - canvasY * newScale;
      clampOffset();
    }
    setZoomLevel(newScale);
    applyTransform();
  }, [clampOffset, applyTransform]);

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
      />
      {needsZoom && zoomLevel > 1.05 && (
        <div className="zoom-indicator">{Math.round(zoomLevel * 100)}%</div>
      )}
      {needsZoom && (
        <div className="zoom-buttons">
          <button className="zoom-btn" onClick={handleZoomIn} aria-label="확대">+</button>
          <button className="zoom-btn" onClick={handleZoomOut} disabled={zoomLevel <= 1.05} aria-label="축소">−</button>
        </div>
      )}
      {needsZoom && zoomLevel <= 1.05 && (
        <div className="zoom-hint">핀치로 확대 · 더블탭 줌인</div>
      )}
    </div>
  );
}
