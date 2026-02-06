function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function CompleteModal({ level, time, puzzleName, stars = 0, onHome, onNext }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onHome()}>
      <div className="modal-content">
        <div className="modal-emoji">🎉</div>
        <h2>퍼즐 완료!</h2>
        {puzzleName && <p className="puzzle-complete-name">{puzzleName}</p>}

        {/* 별점 */}
        {stars > 0 && (
          <div className="stars-display">
            {[1, 2, 3].map((i) => (
              <span
                key={i}
                className={`star ${i <= stars ? 'earned' : 'empty'}`}
                style={{ animationDelay: `${0.2 + i * 0.15}s` }}
              >
                {i <= stars ? '⭐' : '☆'}
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

        <p className="hint-earned-text">💡 힌트 +1 획득!</p>

        <div className="modal-buttons">
          <button className="secondary-btn" onClick={onHome}>
            홈으로
          </button>
          <button className="primary-btn" onClick={onNext}>
            다음 레벨 →
          </button>
        </div>
      </div>
    </div>
  );
}
