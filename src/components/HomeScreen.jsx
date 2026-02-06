import { useMemo, useState, useCallback } from 'react';
import { getSizeForLevel, PRESET_PUZZLES, isLevelUnlocked, createPuzzleForLevel } from '../lib/puzzle.js';
import CollectionView from './CollectionView.jsx';
import { LogoIcon, LightbulbIcon, LockIcon, CheckIcon, StarIcon, PuzzleIcon, SettingsIcon, GridIcon, VideoIcon, DiamondIcon, DifficultyBadge } from './icons/Icons.jsx';

const SECTIONS = [
  { name: '입문', start: 1, end: 5, size: '5×5', color: 'var(--diff-beginner)', colorRaw: '#10B981' },
  { name: '초급', start: 6, end: 15, size: '8×8', color: 'var(--diff-easy)', colorRaw: '#6C5CE7' },
  { name: '중급', start: 16, end: 30, size: '10×10', color: 'var(--diff-medium)', colorRaw: '#8B5CF6' },
  { name: '고급', start: 31, end: 50, size: '15×15', color: 'var(--diff-hard)', colorRaw: '#F97316' },
];

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function StarsDisplay({ stars }) {
  if (!stars) return null;
  return (
    <span className="level-btn-stars">
      {[1, 2, 3].map((i) => (
        <StarIcon key={i} size={8} filled={i <= stars} color={i <= stars ? '#FCD34D' : 'rgba(255,255,255,0.4)'} />
      ))}
    </span>
  );
}

export default function HomeScreen({ appState, collectionProgress, onStartLevel, onOpenSettings, onWatchAd, onBuyHints, onStartCollectionTile }) {
  const { completedLevels = [], currentLevel = 1, bestTimes = {}, bestStars = {}, hints = 3 } = appState;
  const completedSet = useMemo(() => new Set(completedLevels), [completedLevels]);
  const [activeTab, setActiveTab] = useState('puzzle');

  return (
    <div className="home-screen">
      <header className="home-header">
        <div className="app-title-row">
          <LogoIcon size={30} />
          <h1 className="app-title">노노그램</h1>
        </div>
        <p className="app-subtitle">Pixel Puzzle</p>
        <div className="hint-balance">
          <span className="hint-balance-icon">
            <LightbulbIcon size={16} color="var(--accent)" />
          </span>
          <span className="hint-balance-count">{hints}</span>
        </div>
      </header>

      {/* Tab bar — sticky */}
      <div className="home-tab-bar">
        <button
          className={`home-tab ${activeTab === 'puzzle' ? 'active' : ''}`}
          onClick={() => setActiveTab('puzzle')}
        >
          <PuzzleIcon size={18} color={activeTab === 'puzzle' ? 'var(--accent)' : 'var(--text-tertiary)'} />
          퍼즐
        </button>
        <button
          className={`home-tab ${activeTab === 'collection' ? 'active' : ''}`}
          onClick={() => setActiveTab('collection')}
        >
          <GridIcon size={18} color={activeTab === 'collection' ? 'var(--accent)' : 'var(--text-tertiary)'} />
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
                <span className="stat-value">
                  <LightbulbIcon size={18} color="var(--accent)" />
                  {hints}
                </span>
                <span className="stat-label">힌트</span>
              </div>
            </div>

            {/* Hint shop */}
            <div className="hint-shop">
              <div className="hint-shop-title">
                <LightbulbIcon size={16} color="var(--accent)" />
                힌트 충전
              </div>
              <div className="hint-shop-buttons">
                <button className="hint-shop-btn" onClick={onWatchAd}>
                  <span className="hint-shop-btn-icon">
                    <VideoIcon size={18} color="var(--accent)" />
                  </span>
                  <span className="hint-shop-btn-text">광고 보기</span>
                  <span className="hint-shop-btn-reward">+1</span>
                </button>
                <button className="hint-shop-btn" onClick={onBuyHints}>
                  <span className="hint-shop-btn-icon">
                    <DiamondIcon size={18} color="var(--accent)" />
                  </span>
                  <span className="hint-shop-btn-text">힌트 구매</span>
                  <span className="hint-shop-btn-reward">+5</span>
                </button>
              </div>
            </div>

            {/* Level sections */}
            {SECTIONS.map((section) => (
              <div className="level-section-group" key={section.name}>
                <div className="section-title" style={{ color: section.colorRaw }}>
                  <DifficultyBadge color={section.colorRaw} label={section.name} />
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
                          {isLocked ? (
                            <LockIcon size={14} color="var(--text-tertiary)" />
                          ) : isCompleted ? (
                            <CheckIcon size={14} color="white" />
                          ) : (
                            level
                          )}
                        </span>
                        {isCompleted && bestTime && (
                          <span className="level-btn-time">{formatTime(bestTime)}</span>
                        )}
                        {isCompleted && levelStars && (
                          <StarsDisplay stars={levelStars} />
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
            collectionProgress={collectionProgress}
            onStartTile={onStartCollectionTile}
          />
        )}
      </div>

      {/* Bottom nav — fixed */}
      <nav className="home-nav">
        <div className="home-nav-item active">
          <span className="home-nav-icon">
            <PuzzleIcon size={22} color="var(--accent)" />
          </span>
          <span className="home-nav-label">퍼즐</span>
        </div>
        <div className="home-nav-item" onClick={onOpenSettings}>
          <span className="home-nav-icon">
            <SettingsIcon size={22} />
          </span>
          <span className="home-nav-label">설정</span>
        </div>
      </nav>
    </div>
  );
}
