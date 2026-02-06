import { useMemo } from 'react';
import { getSizeForLevel, PRESET_PUZZLES } from '../lib/puzzle.js';

const SECTIONS = [
  { name: '입문', start: 1, end: 5, size: '5×5', color: '#00c471', emoji: '🌱' },
  { name: '초급', start: 6, end: 15, size: '8×8', color: '#3182f6', emoji: '📘' },
  { name: '중급', start: 16, end: 30, size: '10×10', color: '#8b5cf6', emoji: '💜' },
  { name: '고급', start: 31, end: 50, size: '15×15', color: '#f97316', emoji: '🔥' },
];

export default function HomeScreen({ appState, onStartLevel, onOpenSettings }) {
  const { completedLevels = [], currentLevel = 1 } = appState;
  const completedSet = useMemo(() => new Set(completedLevels), [completedLevels]);

  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="app-title">🧩 노노그램</h1>
        <p className="app-subtitle">픽셀 퍼즐</p>
      </header>

      <div className="home-body">
        {/* Stats bar */}
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{completedLevels.length}</span>
            <span className="stat-label">완료</span>
          </div>
          <div className="stat">
            <span className="stat-value">{50 - completedLevels.length}</span>
            <span className="stat-label">남음</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round((completedLevels.length / 50) * 100)}%</span>
            <span className="stat-label">진행률</span>
          </div>
        </div>

        {/* Level sections */}
        {SECTIONS.map((section) => (
          <div className="level-section-group" key={section.name}>
            <div className="section-title" style={{ color: section.color }}>
              {section.emoji} {section.name}{' '}
              <span className="section-size">{section.size}</span>
            </div>
            <div className="level-row">
              {Array.from({ length: section.end - section.start + 1 }, (_, i) => {
                const level = section.start + i;
                const isCompleted = completedSet.has(level);
                const isLocked = level > currentLevel && !isCompleted;
                const isCurrent = level === currentLevel;

                let className = 'level-btn';
                if (isCompleted) className += ' completed';
                if (isLocked) className += ' locked';
                if (isCurrent) className += ' current';

                const presetName =
                  level <= 5 ? PRESET_PUZZLES[(level - 1) % PRESET_PUZZLES.length].name : null;

                return (
                  <button
                    key={level}
                    className={className}
                    disabled={isLocked}
                    onClick={() => onStartLevel(level)}
                    title={presetName ? `${presetName}` : `Level ${level}`}
                  >
                    {isLocked ? '🔒' : isCompleted ? '✓' : level}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom nav */}
      <nav className="home-nav">
        <div className="home-nav-item active">
          <span className="home-nav-icon">🧩</span>
          <span className="home-nav-label">퍼즐</span>
        </div>
        <div className="home-nav-item" onClick={onOpenSettings}>
          <span className="home-nav-icon">⚙️</span>
          <span className="home-nav-label">설정</span>
        </div>
      </nav>
    </div>
  );
}
