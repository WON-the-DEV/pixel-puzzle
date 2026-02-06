function formatTime(ms) {
  const seconds = Math.floor(ms / 1000);
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function CompleteModal({ level, time, puzzleName, onHome, onNext }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onHome()}>
      <div className="modal-content">
        <div className="modal-emoji">🎉</div>
        <h2>퍼즐 완료!</h2>
        {puzzleName && <p className="puzzle-complete-name">{puzzleName}</p>}
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
