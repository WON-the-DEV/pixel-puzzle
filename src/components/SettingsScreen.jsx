import { useState, useCallback } from 'react';
import { loadSettings, saveSettings } from '../lib/settings.js';

export default function SettingsScreen({ onGoHome, onResetTutorial }) {
  const [settings, setSettings] = useState(loadSettings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggle = useCallback((key) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveSettings(next);
      return next;
    });
  }, []);

  const handleResetProgress = useCallback(() => {
    try {
      localStorage.removeItem('nonogram_state');
      localStorage.removeItem('nonogram_game_save');
    } catch {
      // ignore
    }
    setShowResetConfirm(false);
    onGoHome();
    // force full reload to reset app state
    window.location.reload();
  }, [onGoHome]);

  const handleResetTutorial = useCallback(() => {
    try {
      localStorage.removeItem('nonogram_tutorial_seen');
    } catch {
      // ignore
    }
    if (onResetTutorial) onResetTutorial();
  }, [onResetTutorial]);

  return (
    <div className="settings-screen">
      <header className="settings-header">
        <button className="back-btn" onClick={onGoHome} aria-label="뒤로">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="settings-title">설정</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="settings-body">
        {/* 게임 설정 */}
        <div className="settings-section">
          <div className="settings-section-title">게임</div>

          <div className="settings-item" onClick={() => toggle('sound')}>
            <div className="settings-item-left">
              <span className="settings-item-icon">🔊</span>
              <div className="settings-item-text">
                <span className="settings-item-label">사운드 효과</span>
                <span className="settings-item-desc">셀 채우기, 완료 효과음</span>
              </div>
            </div>
            <div className={`settings-toggle ${settings.sound ? 'on' : ''}`}>
              <div className="settings-toggle-knob" />
            </div>
          </div>

          <div className="settings-item" onClick={() => toggle('haptic')}>
            <div className="settings-item-left">
              <span className="settings-item-icon">📳</span>
              <div className="settings-item-text">
                <span className="settings-item-label">햅틱 피드백</span>
                <span className="settings-item-desc">터치 시 진동 (지원 기기)</span>
              </div>
            </div>
            <div className={`settings-toggle ${settings.haptic ? 'on' : ''}`}>
              <div className="settings-toggle-knob" />
            </div>
          </div>

          <div className="settings-item" onClick={() => toggle('showMistakes')}>
            <div className="settings-item-left">
              <span className="settings-item-icon">🔴</span>
              <div className="settings-item-text">
                <span className="settings-item-label">실수 표시</span>
                <span className="settings-item-desc">틀린 셀을 빨간색으로 표시</span>
              </div>
            </div>
            <div className={`settings-toggle ${settings.showMistakes ? 'on' : ''}`}>
              <div className="settings-toggle-knob" />
            </div>
          </div>
        </div>

        {/* 화면 설정 */}
        <div className="settings-section">
          <div className="settings-section-title">화면</div>

          <div className="settings-item disabled" onClick={() => toggle('darkMode')}>
            <div className="settings-item-left">
              <span className="settings-item-icon">🌙</span>
              <div className="settings-item-text">
                <span className="settings-item-label">다크 모드</span>
                <span className="settings-item-desc">준비 중</span>
              </div>
            </div>
            <div className={`settings-toggle ${settings.darkMode ? 'on' : ''}`}>
              <div className="settings-toggle-knob" />
            </div>
          </div>
        </div>

        {/* 기타 */}
        <div className="settings-section">
          <div className="settings-section-title">기타</div>

          <button className="settings-action-btn" onClick={handleResetTutorial}>
            <span className="settings-item-icon">📖</span>
            <span>튜토리얼 다시 보기</span>
          </button>

          <button
            className="settings-action-btn danger"
            onClick={() => setShowResetConfirm(true)}
          >
            <span className="settings-item-icon">🗑️</span>
            <span>진행 초기화</span>
          </button>
        </div>
      </div>

      {/* 초기화 확인 다이얼로그 */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowResetConfirm(false)}>
          <div className="modal-content">
            <div className="modal-emoji">⚠️</div>
            <h2>진행 초기화</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '12px 0 24px', fontSize: 14, lineHeight: 1.5 }}>
              모든 레벨 진행 상황과 기록이<br />삭제됩니다. 되돌릴 수 없어요.
            </p>
            <div className="modal-buttons">
              <button className="secondary-btn" onClick={() => setShowResetConfirm(false)}>
                취소
              </button>
              <button
                className="primary-btn"
                style={{ background: 'var(--danger)' }}
                onClick={handleResetProgress}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
