import { useRef, useCallback, useState } from 'react';
import { PencilIcon, XMarkIcon } from './icons/Icons.jsx';

// Arrow icons
function ArrowUp({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 5l7 7h-4.5v7h-5v-7H5l7-7z" fill={color} />
    </svg>
  );
}
function ArrowDown({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 19l-7-7h4.5V5h5v7H19l-7 7z" fill={color} />
    </svg>
  );
}
function ArrowLeft({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12l7-7v4.5h7v5h-7V19l-7-7z" fill={color} />
    </svg>
  );
}
function ArrowRight({ size = 24, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12l-7 7v-4.5H5v-5h7V5l7 7z" fill={color} />
    </svg>
  );
}

const REPEAT_DELAY = 400;
const REPEAT_INTERVAL = 120;

export default function ControllerPad({ onMove, onFill, onMark }) {
  const repeatRef = useRef(null);
  const holdActionRef = useRef(null); // 'fill' | 'mark' | null

  // Keep latest callbacks in refs to avoid stale closures in intervals/timeouts
  const onMoveRef = useRef(onMove);
  const onFillRef = useRef(onFill);
  const onMarkRef = useRef(onMark);
  onMoveRef.current = onMove;
  onFillRef.current = onFill;
  onMarkRef.current = onMark;

  const handleDirStart = useCallback((dir) => {
    const action = () => onMoveRef.current(dir, holdActionRef.current);

    action();

    let intervalId = null;
    const delayId = setTimeout(() => {
      intervalId = setInterval(action, REPEAT_INTERVAL);
    }, REPEAT_DELAY);

    repeatRef.current = {
      stop: () => {
        clearTimeout(delayId);
        if (intervalId) clearInterval(intervalId);
      }
    };
  }, []);

  const handleDirEnd = useCallback(() => {
    if (repeatRef.current && repeatRef.current.stop) {
      repeatRef.current.stop();
      repeatRef.current = null;
    }
  }, []);

  const dirProps = (dir) => ({
    onTouchStart: (e) => { e.preventDefault(); handleDirStart(dir); },
    onTouchEnd: (e) => { e.preventDefault(); handleDirEnd(); },
    onTouchCancel: handleDirEnd,
    onMouseDown: () => handleDirStart(dir),
    onMouseUp: handleDirEnd,
    onMouseLeave: handleDirEnd,
  });

  // Hold action handlers for fill/mark buttons
  const handleFillStart = useCallback((e) => {
    if (e) e.preventDefault();
    holdActionRef.current = 'fill';
    onFillRef.current();
  }, []);

  const handleFillEnd = useCallback((e) => {
    if (e) e.preventDefault();
    holdActionRef.current = null;
  }, []);

  const handleMarkStart = useCallback((e) => {
    if (e) e.preventDefault();
    holdActionRef.current = 'mark';
    onMarkRef.current();
  }, []);

  const handleMarkEnd = useCallback((e) => {
    if (e) e.preventDefault();
    holdActionRef.current = null;
  }, []);

  return (
    <div className="controller-pad">
      <div className="controller-left">
        {/* 십자키 3x3 그리드 */}
        <div className="dpad-grid">
          <div />
          <button className="dpad-btn" {...dirProps('up')} aria-label="위">
            <ArrowUp size={22} color="var(--text)" />
          </button>
          <div />
          <button className="dpad-btn" {...dirProps('left')} aria-label="왼쪽">
            <ArrowLeft size={22} color="var(--text)" />
          </button>
          <div className="dpad-center-dot" />
          <button className="dpad-btn" {...dirProps('right')} aria-label="오른쪽">
            <ArrowRight size={22} color="var(--text)" />
          </button>
          <div />
          <button className="dpad-btn" {...dirProps('down')} aria-label="아래">
            <ArrowDown size={22} color="var(--text)" />
          </button>
          <div />
        </div>
      </div>
      <div className="controller-right">
        <button
          className="action-btn action-fill"
          onTouchStart={handleFillStart}
          onTouchEnd={handleFillEnd}
          onTouchCancel={handleFillEnd}
          onMouseDown={handleFillStart}
          onMouseUp={handleFillEnd}
          onMouseLeave={handleFillEnd}
          aria-label="채우기"
        >
          <PencilIcon size={20} color="var(--accent)" />
          <span className="action-btn-label">채우기</span>
        </button>
        <button
          className="action-btn action-mark"
          onTouchStart={handleMarkStart}
          onTouchEnd={handleMarkEnd}
          onTouchCancel={handleMarkEnd}
          onMouseDown={handleMarkStart}
          onMouseUp={handleMarkEnd}
          onMouseLeave={handleMarkEnd}
          aria-label="X표시"
        >
          <XMarkIcon size={20} color="var(--danger)" />
          <span className="action-btn-label">X표시</span>
        </button>
      </div>
    </div>
  );
}
