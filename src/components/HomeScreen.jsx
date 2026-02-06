import { useMemo, useState, useCallback } from 'react';
import { getSizeForLevel, PRESET_PUZZLES, COLLECTIONS, isLevelUnlocked, createPuzzleForLevel } from '../lib/puzzle.js';
import CollectionView from './CollectionView.jsx';

const SECTIONS = [
  { name: '입문', start: 1, end: 5, size: '5×5', color: '#00c471', emoji: '🌱' },
  { name: '초급', start: 6, end: 15, size: '8×8', color: '#3182f6', emoji: '📘' },
  { name: '중급', start: 16, end: 30, size: '10×10', color: '#8b5cf6', emoji: '💜' },
  { name: '고급', start: 31, end: 50, size: '15×15', color: '#f97316', emoji: '🔥' },
];

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatStars(stars) {
  if (!stars) return '';
  return '⭐'.repeat(stars);
}

export default function HomeScreen({ appState, onStartLevel, onOpenSettings, onWatchAd, onBuyHints }) {
  const { completedLevels = [], currentLevel = 1, bestTimes = {}, bestStars = {}, hints = 3 } = appState;
  const completedSet = useMemo(() => new Set(completedLevels), [completedLevels]);
  const [activeTab, setActiveTab] = useState('puzzle'); // 'puzzle' | 'collection'

  return (
    <div className="home-screen">
      <header className="home-header">
        <h1 className="app-title">🧩 노노그램</h1>
        <p className="app-subtitle">픽셀 퍼즐</p>
        <div className="hint-balance">
          <span className="hint-balance-icon">💡</span>
          <span className="hint-balance-count">{hints}</span>
        </div>
      </header>

      {/* Tab bar */}
      <div className="home-tab-bar">
        <button
          className={`home-tab ${activeTab === 'puzzle' ? 'active' : ''}`}
          onClick={() => setActiveTab('puzzle')}
        >
          퍼즐
        </button>
        <button
          className={`home-tab ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          컬렉션
        </button>
      </div>

      <div className="home-body">
        {activeTab === 'puzzle' ? (
          <>
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
              <div className="stat">
                <span className="stat-value">💡 {hints}</span>
                <span className="stat-label">힌트</span>
              </div>
            </div>

            {/* Hint shop */}
            <div className="hint-shop">
              <div className="hint-shop-title">💡 힌트 충전</div>
              <div className="hint-shop-buttons">
                <button className="hint-shop-btn" onClick={onWatchAd}>
                  <span className="hint-shop-btn-icon">🎬</span>
                  <span className="hint-shop-btn-text">광고 보기</span>
                  <span className="hint-shop-btn-reward">+1</span>
                </button>
                <button className="hint-shop-btn" onClick={onBuyHints}>
                  <span className="hint-shop-btn-icon">💎</span>
                  <span className="hint-shop-btn-text">힌트 구매</span>
                  <span className="hint-shop-btn-reward">+5</span>
                </button>
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
                    const isUnlocked = isLevelUnlocked(level, completedLevels);
                    const isLocked = !isUnlocked && !isCompleted;
                    const isCurrent = isUnlocked && !isCompleted;

                    let className = 'level-btn';
                    if (isCompleted) className += ' completed';
                    if (isLocked) className += ' locked';
                    if (isCurrent) className += ' current';

                    const presetName =
                      level <= 5 ? PRESET_PUZZLES[(level - 1) % PRESET_PUZZLES.length].name : null;

                    const bestTime = bestTimes[level];
                    const levelStars = bestStars[level];

                    return (
                      <button
                        key={level}
                        className={className}
                        disabled={isLocked}
                        onClick={() => onStartLevel(level)}
                        title={presetName ? `${presetName}` : `Level ${level}`}
                      >
                        <span className="level-btn-number">
                          {isLocked ? '🔒' : isCompleted ? '✓' : level}
                        </span>
                        {isCompleted && bestTime && (
                          <span className="level-btn-time">{formatTime(bestTime)}</span>
                        )}
                        {isCompleted && levelStars && (
                          <span className="level-btn-stars">{formatStars(levelStars)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        ) : (
          <CollectionView
            completedLevels={completedLevels}
          />
        )}
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
