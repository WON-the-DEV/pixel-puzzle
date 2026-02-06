import { useMemo } from 'react';
import {
  getTodayStr,
  getRecentDates,
  isDailyCompleted,
  calculateStreak,
  loadDailyState,
} from '../lib/dailyChallenge.js';
import { CheckIcon } from './icons/Icons.jsx';

// ─── 캘린더 아이콘 ───
function CalendarIcon({ size = 20, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── 불꽃 아이콘 (streak) ───
function FlameIcon({ size = 18, color = '#f97316' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 23c-4.97 0-9-3.58-9-8 0-3.19 2.13-6.17 4-8 .28-.27.8-.04.72.34C7.28 9.5 8.5 12 12 12c-1-3 1.5-6.5 3-8 .27-.27.78-.06.72.3C15.25 7.5 17 9 18.5 11c1.5 2 2.5 4 2.5 4 0 4.42-4.03 8-9 8z" />
    </svg>
  );
}

// ─── 요일 이름 ───
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export default function DailyChallenge({ onStartDaily }) {
  const todayStr = useMemo(() => getTodayStr(), []);
  const recentDates = useMemo(() => getRecentDates(7), []);
  const streak = useMemo(() => calculateStreak(), []);
  const todayCompleted = useMemo(() => isDailyCompleted(todayStr), [todayStr]);
  const todayState = useMemo(() => loadDailyState(todayStr), [todayStr]);
  const todayProgress = todayState && !todayState.completed
    ? Math.round(((todayState.filledCorrect || 0) / (todayState.totalFilled || 1)) * 100)
    : 0;

  return (
    <div className="daily-challenge-card" onClick={() => onStartDaily(todayStr)}>
      {/* 헤더 */}
      <div className="daily-header">
        <div className="daily-title-row">
          <CalendarIcon size={20} color="var(--accent)" />
          <span className="daily-title">오늘의 퍼즐</span>
          {todayCompleted && (
            <span className="daily-badge">✅ 완료!</span>
          )}
        </div>
        {streak > 0 && (
          <div className="daily-streak">
            <FlameIcon size={16} />
            <span>{streak}일 연속</span>
          </div>
        )}
      </div>

      {/* 진행 상태 */}
      {!todayCompleted && todayProgress > 0 && (
        <div className="daily-progress">
          <div className="daily-progress-bar">
            <div className="daily-progress-fill" style={{ width: `${todayProgress}%` }} />
          </div>
          <span className="daily-progress-text">{todayProgress}%</span>
        </div>
      )}

      {!todayCompleted && todayProgress === 0 && (
        <p className="daily-cta">10×10 · 탭하여 시작 →</p>
      )}

      {/* 최근 7일 캘린더 */}
      <div className="daily-calendar">
        {recentDates.map((dateStr) => {
          const d = new Date(dateStr + 'T00:00:00');
          const dayName = DAY_NAMES[d.getDay()];
          const dayNum = d.getDate();
          const completed = isDailyCompleted(dateStr);
          const isToday = dateStr === todayStr;

          return (
            <div
              key={dateStr}
              className={`daily-cal-day ${isToday ? 'today' : ''} ${completed ? 'completed' : ''}`}
            >
              <span className="daily-cal-name">{dayName}</span>
              <div className={`daily-cal-circle ${completed ? 'done' : ''} ${isToday ? 'current' : ''}`}>
                {completed ? (
                  <CheckIcon size={14} color="white" />
                ) : (
                  <span className="daily-cal-num">{dayNum}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
