import { CelebrationIcon, StarIcon, LightbulbIcon } from './icons/Icons.jsx';

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

function PixelArt({ solution, size }) {
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
        row.map((cell, j) => (
          <div
            key={`${i}-${j}`}
            style={{
              width: cellPx,
              height: cellPx,
              background: cell === 1 ? color : 'var(--bg)',
            }}
          />
        ))
      )}
    </div>
  );
}

export default function CompleteModal({ level, time, puzzleName, stars = 0, onHome, onNext, puzzle, isDaily = false }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onHome()}>
      <div className="modal-content">
        <div className="modal-icon">
          <CelebrationIcon size={64} />
        </div>
        <h2>퍼즐 완료!</h2>
        {puzzleName && <p className="puzzle-complete-name">{puzzleName}</p>}

        {/* 완성된 픽셀 아트 */}
        {puzzle && puzzle.solution && (
          <PixelArt solution={puzzle.solution} size={puzzle.size} />
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
            <span className="result-stat-value">Level {level}</span>
            <span className="result-stat-label">레벨</span>
          </div>
          <div className="result-divider" />
          <div className="result-stat">
            <span className="result-stat-value">{formatTime(time)}</span>
            <span className="result-stat-label">클리어 시간</span>
          </div>
        </div>

        <p className="hint-earned-text">
          <LightbulbIcon size={16} color="var(--success)" />
          힌트 +1 획득!
        </p>

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
      </div>
    </div>
  );
}
