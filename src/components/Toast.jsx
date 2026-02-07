import { useState, useEffect, useCallback } from 'react';

/**
 * 토스트 알림 컴포넌트
 * 화면 상단에 slide-down으로 등장, 2초 후 slide-up으로 사라짐
 */
export default function Toast({ message, icon, visible, onDone }) {
  const [phase, setPhase] = useState('hidden'); // hidden | entering | showing | leaving

  useEffect(() => {
    if (visible && message) {
      setPhase('entering');
      const enterTimer = setTimeout(() => setPhase('showing'), 50);
      const leaveTimer = setTimeout(() => setPhase('leaving'), 2200);
      const doneTimer = setTimeout(() => {
        setPhase('hidden');
        if (onDone) onDone();
      }, 2600);
      return () => {
        clearTimeout(enterTimer);
        clearTimeout(leaveTimer);
        clearTimeout(doneTimer);
      };
    } else {
      setPhase('hidden');
    }
  }, [visible, message, onDone]);

  if (phase === 'hidden') return null;

  const isVisible = phase === 'showing';
  const isLeaving = phase === 'leaving';

  return (
    <div
      className={`toast-container ${isVisible ? 'toast-visible' : ''} ${isLeaving ? 'toast-leaving' : ''}`}
    >
      <div className="toast-content">
        {icon && <span className="toast-icon">{icon}</span>}
        <span className="toast-text">{message}</span>
      </div>
    </div>
  );
}

/**
 * 토스트 큐 매니저 — 여러 토스트를 순차적으로 표시
 */
export function ToastManager({ toasts, onClear }) {
  const [current, setCurrent] = useState(null);
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (toasts && toasts.length > 0) {
      setQueue(prev => [...prev, ...toasts]);
      if (onClear) onClear();
    }
  }, [toasts, onClear]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue(prev => prev.slice(1));
    }
  }, [current, queue]);

  const handleDone = useCallback(() => {
    setCurrent(null);
  }, []);

  if (!current) return null;

  return (
    <Toast
      message={current.message}
      icon={current.icon}
      visible={true}
      onDone={handleDone}
    />
  );
}
