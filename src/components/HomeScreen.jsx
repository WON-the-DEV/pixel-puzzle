import { useMemo, useState, useCallback, useEffect, useRef, memo } from 'react';
import { getSizeForLevel, PRESET_PUZZLES, isLevelUnlocked, createPuzzleForLevel, TOTAL_LEVELS } from '../lib/puzzle.js';
import CollectionView from './CollectionView.jsx';
import DailyChallenge from './DailyChallenge.jsx';
import { LogoIcon, LightbulbIcon, LockIcon, CheckIcon, StarIcon, PuzzleIcon, SettingsIcon, GridIcon, VideoIcon, DiamondIcon, DifficultyBadge } from './icons/Icons.jsx';
import { getRemainingAds, TossSDK } from '../lib/tossSDK.js';

// Hint modal component
function HintModal({ hints, onWatchAd, onBuyHints, onClose }) {
  const remainingAds = getRemainingAds();
  const adDisabled = remainingAds <= 0;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="힌트 충전" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content hint-modal-redesign">
        <div className="hint-modal-header">
          <div className="hint-modal-icon-large">💡</div>
          <h2 style={{ margin: 0 }}>힌트 충전</h2>
          <p className="hint-modal-balance">
            보유 <strong>{hints}</strong>개
          </p>
        </div>
        <div className="hint-modal-cards">
          <button
            className={`hint-card ${adDisabled ? 'disabled' : ''}`}
            disabled={adDisabled}
            onClick={() => { if (!adDisabled) { onWatchAd(); onClose(); } }}
          >
            <div className="hint-card-icon">
              <VideoIcon size={28} color={adDisabled ? 'var(--text-tertiary)' : 'var(--accent)'} />
            </div>
            <div className="hint-card-info">
              <span className="hint-card-title">광고 보기</span>
              <span className="hint-card-price">무료 (광고)</span>
              <span className="hint-card-limit">오늘 {remainingAds}/{TossSDK.MAX_DAILY_ADS}회 남음</span>
            </div>
            <div className="hint-card-reward">+1</div>
          </button>
          <button
            className="hint-card"
            onClick={() => { onBuyHints(); onClose(); }}
          >
            <div className="hint-card-icon">
              <DiamondIcon size={28} color="#a855f7" />
            </div>
            <div className="hint-card-info">
              <span className="hint-card-title">힌트 구매</span>
              <span className="hint-card-price">₩1,000</span>
            </div>
            <div className="hint-card-reward">+5</div>
          </button>
        </div>
        <button className="secondary-btn" onClick={onClose} style={{ width: '100%', marginTop: 8 }}>닫기</button>
      </div>
    </div>
  );
}

const SECTIONS = [
  { name: '입문', start: 1, end: 30, size: '5×5', color: 'var(--diff-beginner)', colorRaw: '#10B981' },
  { name: '초급', start: 31, end: 70, size: '8×8', color: 'var(--diff-easy)', colorRaw: '#6C5CE7' },
  { name: '중급', start: 71, end: 115, size: '10×10', color: 'var(--diff-medium)', colorRaw: '#8B5CF6' },
  { name: '고급', start: 116, end: 150, size: '15×15', color: 'var(--diff-hard)', colorRaw: '#F97316' },
];

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Chevron icon for accordion
function ChevronDown({ size = 18, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarsDisplay({ stars, small }) {
  if (!stars) return null;
  const iconSize = small ? 7 : 8;
  return (
    <span className="level-btn-stars">
      {[1, 2, 3].map((i) => (
        <StarIcon key={i} size={iconSize} filled={i <= stars} color={i <= stars ? '#FCD34D' : 'rgba(255,255,255,0.4)'} />
      ))}
    </span>
  );
}

// Cache for puzzle solutions to avoid re-generating on every render
const puzzleCache = {};
function getCachedSolution(level) {
  if (!puzzleCache[level]) {
    puzzleCache[level] = createPuzzleForLevel(level);
  }
  return puzzleCache[level];
}

// Mini pixel art display for completed levels
const MiniPuzzleArt = memo(function MiniPuzzleArt({ level, sectionColor }) {
  const puzzle = getCachedSolution(level);
  if (!puzzle) return null;
  const { size, solution } = puzzle;
  const totalSize = 44;
  const cellPx = Math.floor(totalSize / size);
  const actualSize = cellPx * size;

  return (
    <div
      className="mini-puzzle-art"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
        gridTemplateRows: `repeat(${size}, ${cellPx}px)`,
        width: actualSize,
        height: actualSize,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {solution.map((row, i) =>
        row.map((cell, j) => (
          <div
            key={`${i}-${j}`}
            style={{
              width: cellPx,
              height: cellPx,
              background: cell === 1 ? sectionColor : 'transparent',
            }}
          />
        ))
      )}
    </div>
  );
});

export default function HomeScreen({ appState, collectionProgress, onStartLevel, onOpenSettings, onWatchAd, onBuyHints, onStartCollectionTile, onStartDaily, activeTab: externalTab, onTabChange, savedScrollY, onScrollChange }) {
  const { completedLevels = [], currentLevel = 1, bestTimes = {}, bestStars = {}, hints = 3 } = appState;
  const completedSet = useMemo(() => new Set(completedLevels), [completedLevels]);
  const activeTab = externalTab || 'puzzle';
  const setActiveTab = onTabChange || (() => {});
  const bodyRef = useRef(null);
  const [showHintModal, setShowHintModal] = useState(false);

  // Accordion state: determine which sections should be open by default
  const getDefaultOpenSections = useCallback(() => {
    const openSet = new Set();
    for (const section of SECTIONS) {
      const levels = Array.from({ length: section.end - section.start + 1 }, (_, i) => section.start + i);
      const allCompleted = levels.every(l => completedSet.has(l));
      const hasPlayable = levels.some(l => isLevelUnlocked(l, completedLevels) && !completedSet.has(l));

      // Open if has playable (current progress) or not all completed
      if (hasPlayable || !allCompleted) {
        openSet.add(section.name);
      }
    }
    // Always have at least one section open
    if (openSet.size === 0) openSet.add(SECTIONS[0].name);
    return openSet;
  }, [completedLevels, completedSet]);

  const [openSections, setOpenSections] = useState(() => getDefaultOpenSections());

  const toggleSection = useCallback((sectionName) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionName)) {
        next.delete(sectionName);
      } else {
        next.add(sectionName);
      }
      return next;
    });
  }, []);

  // 스크롤 위치 복원
  useEffect(() => {
    if (bodyRef.current && savedScrollY > 0) {
      bodyRef.current.scrollTop = savedScrollY;
    }
  }, []);

  // 스크롤 위치 저장
  useEffect(() => {
    const el = bodyRef.current;
    if (!el || !onScrollChange) return;
    const handleScroll = () => { onScrollChange(el.scrollTop); };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [onScrollChange]);

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

      <div className="home-body" ref={bodyRef}>
        {activeTab === 'puzzle' ? (
          <>
            {/* Compact stats line */}
            <div className="stats-line">
              <span className="stats-line-text">
                {TOTAL_LEVELS} 퍼즐 · {Math.round((completedLevels.length / TOTAL_LEVELS) * 100)}% 완료
              </span>
              <button className="stats-line-hint" onClick={() => setShowHintModal(true)}>
                <LightbulbIcon size={16} color="var(--accent)" />
                <span>{hints}</span>
              </button>
            </div>

            {/* Daily Challenge */}
            <DailyChallenge onStartDaily={onStartDaily} />

            {/* Level sections — accordion */}
            {SECTIONS.map((section) => {
              const levels = Array.from({ length: section.end - section.start + 1 }, (_, i) => section.start + i);
              const completedCount = levels.filter(l => completedSet.has(l)).length;
              const totalCount = levels.length;
              const isOpen = openSections.has(section.name);

              return (
                <div className="level-section-group" key={section.name}>
                  <div className="section-header" role="button" tabIndex={0} aria-expanded={isOpen} onClick={() => toggleSection(section.name)} onKeyDown={(e) => e.key === 'Enter' && toggleSection(section.name)}>
                    <div className="section-header-left">
                      <div className="section-title" style={{ color: section.colorRaw, marginBottom: 0 }}>
                        <DifficultyBadge color={section.colorRaw} label={section.name} />
                        <span className="section-size">{section.size}</span>
                      </div>
                    </div>
                    <div className="section-header-right">
                      <span className="section-progress-text">{completedCount}/{totalCount}</span>
                      <span className={`section-chevron ${isOpen ? 'open' : ''}`}>
                        <ChevronDown size={18} color="var(--text-tertiary)" />
                      </span>
                    </div>
                  </div>
                  <div className={`section-body ${isOpen ? 'expanded' : 'collapsed'}`}>
                    <div className="level-row">
                      {levels.map((level) => {
                        const isCompleted = completedSet.has(level);
                        const isUnlocked = isLevelUnlocked(level, completedLevels);
                        const isLocked = !isUnlocked && !isCompleted;
                        const isCurrent = isUnlocked && !isCompleted;

                        let className = 'level-btn';
                        if (isCompleted) className += ' completed';
                        if (isLocked) className += ' locked';
                        if (isCurrent) className += ' current';

                        const puzzleInfo = getCachedSolution(level);
                        const presetName = puzzleInfo.name;

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
                            {isCompleted ? (
                              <>
                                <MiniPuzzleArt level={level} sectionColor={section.colorRaw} />
                                <div className="level-btn-completed-info">
                                  {levelStars && <StarsDisplay stars={levelStars} small />}
                                  {bestTime && <span className="level-btn-time">{formatTime(bestTime)}</span>}
                                  {presetName && <span className="level-btn-name">{presetName}</span>}
                                </div>
                              </>
                            ) : (
                              <span className="level-btn-number">
                                {isLocked ? (
                                  <LockIcon size={14} color="var(--text-tertiary)" />
                                ) : (
                                  level
                                )}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
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
        <div className="home-nav-item" role="button" tabIndex={0} onClick={onOpenSettings} onKeyDown={(e) => e.key === 'Enter' && onOpenSettings()}>
          <span className="home-nav-icon">
            <SettingsIcon size={22} />
          </span>
          <span className="home-nav-label">설정</span>
        </div>
      </nav>

      {/* Hint Modal */}
      {showHintModal && (
        <HintModal
          hints={hints}
          onWatchAd={onWatchAd}
          onBuyHints={onBuyHints}
          onClose={() => setShowHintModal(false)}
        />
      )}
    </div>
  );
}
