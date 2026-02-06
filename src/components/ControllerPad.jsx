import { useRef, useCallback } from 'react';
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

const REPEAT_DELAY = 400; // ms before repeat starts
const REPEAT_INTERVAL = 120; // ms between repeats

export default function ControllerPad({ onMove, onFill, onMark }) {
  const repeatRef = useRef(null);

  const startRepeat = useCallback((action) => {
    // Execute once immediately
    action();
    // After delay, start repeating
    const delayTimer = setTimeout(() => {
      repeatRef.current = setInterval(action, REPEAT_INTERVAL);
    }, REPEAT_DELAY);
    repeatRef.current = delayTimer;
    // Store the actual type to clean up
    repeatRef.current = { delayTimer, intervalTimer: null };
    repeatRef.current.delayTimer = delayTimer;
    // Set up the interval after delay
    clearTimeout(repeatRef.current?.delayTimer);
    repeatRef.current = null;

    // Simplified repeat logic
    let intervalId = null;
    const delayId = setTimeout(() => {
      intervalId = setInterval(action, REPEAT_INTERVAL);
    }, REPEAT_DELAY);

    repeatRef.current = { delayId, get intervalId() { return intervalId; }, set intervalId(v) { intervalId = v; } };
  }, []);

  const stopRepeat = useCallback(() => {
    if (repeatRef.current) {
      clearTimeout(repeatRef.current.delayId);
      if (repeatRef.current.intervalId) {
        clearInterval(repeatRef.current.intervalId);
      }
      repeatRef.current = null;
    }
  }, []);

  const handleDirStart = useCallback((dir) => {
    const action = () => onMove(dir);
    action();

    let intervalId = null;
    const delayId = setTimeout(() => {
      intervalId = setInterval(action, REPEAT_INTERVAL);
    }, REPEAT_DELAY);

    repeatRef.current = { delayId, intervalId: null };
    // Update intervalId ref after it's created
    const checkInterval = setInterval(() => {
      if (intervalId) {
        if (repeatRef.current) repeatRef.current._intervalId = intervalId;
        clearInterval(checkInterval);
      }
    }, 50);

    repeatRef.current = {
      stop: () => {
        clearTimeout(delayId);
        clearInterval(checkInterval);
        if (intervalId) clearInterval(intervalId);
      }
    };
  }, [onMove]);

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

  return (
    <div className="controller-pad">
      <div className="controller-dpad">
        <div className="dpad-row">
          <div className="dpad-spacer" />
          <button className="dpad-btn dpad-up" {...dirProps('up')} aria-label="위">
            <ArrowUp size={22} color="var(--text)" />
          </button>
          <div className="dpad-spacer" />
        </div>
        <div className="dpad-row">
          <button className="dpad-btn dpad-left" {...dirProps('left')} aria-label="왼쪽">
            <ArrowLeft size={22} color="var(--text)" />
          </button>
          <button className="dpad-btn dpad-center dpad-fill" onTouchStart={(e) => { e.preventDefault(); onFill(); }} onClick={onFill} aria-label="채우기">
            <PencilIcon size={20} color="var(--accent)" />
          </button>
          <button className="dpad-btn dpad-right" {...dirProps('right')} aria-label="오른쪽">
            <ArrowRight size={22} color="var(--text)" />
          </button>
        </div>
        <div className="dpad-row">
          <div className="dpad-spacer" />
          <button className="dpad-btn dpad-down" {...dirProps('down')} aria-label="아래">
            <ArrowDown size={22} color="var(--text)" />
          </button>
          <button className="dpad-btn dpad-mark" onTouchStart={(e) => { e.preventDefault(); onMark(); }} onClick={onMark} aria-label="X표시">
            <XMarkIcon size={20} color="var(--danger)" />
          </button>
        </div>
      </div>
    </div>
  );
}
