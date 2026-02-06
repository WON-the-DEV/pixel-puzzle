import { BrokenHeartIcon, VideoIcon } from './icons/Icons.jsx';

export default function GameOverModal({ level, onRestart, onHome, onRevive, usedRevive }) {
  const handleRevive = () => {
    alert('광고 시청 완료! ❤️ 부활!');
    if (onRevive) onRevive();
  };

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
        {!usedRevive && onRevive && (
          <button className="revive-btn" onClick={handleRevive}>
            <VideoIcon size={20} color="white" />
            <span>광고 보고 계속하기</span>
          </button>
        )}
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
