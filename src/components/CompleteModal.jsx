import { useState, useCallback, useMemo } from 'react';
import { CelebrationIcon, StarIcon, LightbulbIcon } from './icons/Icons.jsx';
import { sharePuzzleResult } from '../lib/shareImage.js';
import { calculateStreak } from '../lib/dailyChallenge.js';

const CONFETTI_COLORS = ['#6C5CE7', '#FF6B6B', '#FECA57', '#48DBFB', '#FF9FF3', '#54A0FF', '#5F27CD', '#01a3a4', '#f368e0', '#ff9f43'];
const CONFETTI_COUNT = 28;

function ConfettiEffect() {
  const particles = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
      const left = Math.random() * 100;
      const delay = Math.random() * 1.5;
      const duration = 2 + Math.random() * 1.5;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const size = 6 + Math.random() * 6;
      const rotate = Math.random() * 720;
      const isCircle = Math.random() > 0.5;
      return { left, delay, duration, color, size, rotate, isCircle };
    });
  }, []);

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={i}
          className="confetti-particle"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            backgroundColor: p.color,
            width: p.size,
            height: p.isCircle ? p.size : p.size * 0.6,
            borderRadius: p.isCircle ? '50%' : '2px',
            '--confetti-rotate': `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
}

function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getSizeColor(size) {
  if (size <= 5) return '#22c55e';
  if (size <= 8) return '#6c5ce7';
  if (size <= 10) return '#a855f7';
  return '#f97316';
}

function PixelArt({ solution, size, palette }) {
  const color = getSizeColor(size);
  const maxPx = 160;
  const cellPx = Math.floor(maxPx / size);
  const actualSize = cellPx * size;

  return (
    <div
      className="pixel-art-preview"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${size}, ${cellPx}px)`,
        gridTemplateRows: `repeat(${size}, ${cellPx}px)`,
        width: actualSize,
        height: actualSize,
        borderRadius: 8,
        overflow: 'hidden',
        margin: '0 auto 12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}
    >
      {solution.map((row, i) =>
        row.map((cell, j) => {
          let bg = 'var(--bg)';
          if (cell > 0) {
            if (palette && palette.length > 0) {
              bg = palette[cell - 1] || color;
            } else {
              bg = color;
            }
          }
          return (
            <div
              key={`${i}-${j}`}
              style={{
                width: cellPx,
                height: cellPx,
                background: bg,
              }}
            />
          );
        })
      )}
    </div>
  );
}

export default function CompleteModal({ level, time, puzzleName, stars = 0, onHome, onNext, puzzle, isDaily = false }) {
  const [shareState, setShareState] = useState('idle'); // idle | sharing | shared | downloaded

  const handleShare = useCallback(async () => {
    if (!puzzle) return;
    setShareState('sharing');
    try {
      const streak = isDaily ? calculateStreak() : 0;
      const result = await sharePuzzleResult({
        solution: puzzle.solution,
        size: puzzle.size,
        puzzleName: isDaily ? '오늘의 퍼즐' : puzzleName,
        time,
        stars,
        palette: puzzle.palette,
        isDaily,
        streak: streak > 0 ? streak : undefined,
        dateStr: puzzle.dateStr,
      });
      setShareState(result === 'shared' ? 'shared' : result === 'downloaded' ? 'downloaded' : 'idle');
      // Reset after 2s
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      setShareState('idle');
    }
  }, [puzzle, puzzleName, time, stars, isDaily]);

  const shareLabel = shareState === 'sharing' ? '⏳ 생성 중...'
    : shareState === 'shared' ? '✅ 공유 완료!'
    : shareState === 'downloaded' ? '✅ 다운로드 완료!'
    : '📤 공유하기';

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="퍼즐 완료" onClick={(e) => e.target === e.currentTarget && onHome()}>
      <ConfettiEffect />
      <div className="modal-content complete-modal">
        <div className="modal-icon">
          <CelebrationIcon size={64} />
        </div>
        <h2>퍼즐 완료!</h2>
        {puzzleName && <p className="puzzle-complete-name">{puzzleName}</p>}

        {/* 완성된 픽셀 아트 */}
        {puzzle && puzzle.solution && (
          <PixelArt solution={puzzle.solution} size={puzzle.size} palette={puzzle.palette} />
        )}

        {/* 별점 */}
        {stars > 0 && (
          <div className="stars-display">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`star ${i <= stars ? 'earned' : 'empty'}`}
                style={{ animationDelay: `${0.2 + i * 0.15}s` }}
              >
                <StarIcon size={28} filled={i <= stars} color={i <= stars ? 'var(--warning)' : 'var(--text-tertiary)'} />
              </span>
            ))}
          </div>
        )}

        <div className="result-stats">
          <div className="result-stat">
            <span className="result-stat-value">{isDaily ? '📅' : `Level ${level}`}</span>
            <span className="result-stat-label">{isDaily ? '일일 챌린지' : '레벨'}</span>
          </div>
          <div className="result-divider" />
          <div className="result-stat">
            <span className="result-stat-value">{formatTime(time)}</span>
            <span className="result-stat-label">클리어 시간</span>
          </div>
        </div>

        <div className="modal-buttons">
          {isDaily ? (
            <button className="primary-btn" onClick={onHome} aria-label="홈 화면으로 돌아가기" style={{ width: '100%' }}>
              🎉 홈으로
            </button>
          ) : (
            <>
              <button className="secondary-btn" onClick={onHome} aria-label="홈 화면으로 돌아가기">
                홈으로
              </button>
              <button className="primary-btn" onClick={onNext} aria-label="다음 레벨로 진행">
                다음 레벨 →
              </button>
            </>
          )}
        </div>

        {/* 공유 버튼 */}
        <button
          className="share-btn"
          onClick={handleShare}
          disabled={shareState === 'sharing'}
          aria-label="결과 공유하기"
        >
          {shareLabel}
        </button>
      </div>
    </div>
  );
}
