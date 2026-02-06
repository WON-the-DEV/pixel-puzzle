import { BrokenHeartIcon } from './icons/Icons.jsx';

export default function GameOverModal({ level, onRestart, onHome }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onHome()}>
      <div className="modal-content game-over-modal">
        <div className="modal-icon">
          <BrokenHeartIcon size={64} />
        </div>
        <h2>게임 오버</h2>
        <p className="game-over-desc">
          라이프를 모두 소진했어요
        </p>
        <div className="result-stats">
          <div className="result-stat">
            <span className="result-stat-value">Level {level}</span>
            <span className="result-stat-label">레벨</span>
          </div>
        </div>
        <div className="modal-buttons">
          <button className="secondary-btn" onClick={onHome}>
            홈으로
          </button>
          <button className="primary-btn" onClick={onRestart}>
            다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}
