import { useState, useCallback, useEffect } from 'react';
import { loadSettings, saveSettings } from '../lib/settings.js';
import { BackIcon, SoundIcon, VibrationIcon, EyeIcon, MoonIcon, BookIcon, TrashIcon, AlertIcon, CheckIcon } from './icons/Icons.jsx';

export default function SettingsScreen({ onGoHome, onResetTutorial, onUnlockAll }) {
  const [settings, setSettings] = useState(loadSettings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const toggle = useCallback((key) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveSettings(next);
      return next;
    });
  }, []);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');
    // Update theme-color meta tag
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', settings.darkMode ? '#1A1A2E' : '#ffffff');
    }
  }, [settings.darkMode]);

  const handleResetProgress = useCallback(() => {
    try {
      localStorage.removeItem('nonogram_state');
      localStorage.removeItem('nonogram_game_save');
    } catch {
      // ignore
    }
    setShowResetConfirm(false);
    onGoHome();
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
          <BackIcon size={24} />
        </button>
        <h1 className="settings-title">설정</h1>
        <div style={{ width: 40 }} />
      </header>

      <div className="settings-body">
        {/* 게임 설정 */}
        <div className="settings-section">
          <div className="settings-section-title">게임</div>
          <div className="settings-card">
            <div className="settings-item" onClick={() => toggle('sound')}>
              <div className="settings-item-left">
                <span className="settings-item-icon">
                  <SoundIcon size={20} color="var(--accent)" />
                </span>
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
                <span className="settings-item-icon">
                  <VibrationIcon size={20} color="var(--accent)" />
                </span>
                <div className="settings-item-text">
                  <span className="settings-item-label">햅틱 피드백</span>
                  <span className="settings-item-desc">터치 시 진동 (지원 기기)</span>
                </div>
              </div>
              <div className={`settings-toggle ${settings.haptic ? 'on' : ''}`}>
                <div className="settings-toggle-knob" />
              </div>
            </div>

            {/* 실수 표시는 항상 켜짐 (기본 동작) — 토글 제거됨 */}
          </div>
        </div>

        {/* 화면 설정 */}
        <div className="settings-section">
          <div className="settings-section-title">화면</div>
          <div className="settings-card">
            <div className="settings-item" onClick={() => toggle('darkMode')}>
              <div className="settings-item-left">
                <span className="settings-item-icon">
                  <MoonIcon size={20} color="var(--accent)" />
                </span>
                <div className="settings-item-text">
                  <span className="settings-item-label">다크 모드</span>
                  <span className="settings-item-desc">어두운 테마로 전환</span>
                </div>
              </div>
              <div className={`settings-toggle ${settings.darkMode ? 'on' : ''}`}>
                <div className="settings-toggle-knob" />
              </div>
            </div>
          </div>
        </div>

        {/* 기타 */}
        <div className="settings-section">
          <div className="settings-section-title">기타</div>

          <button className="settings-action-btn" onClick={handleResetTutorial}>
            <span className="settings-item-icon">
              <BookIcon size={20} color="var(--text-secondary)" />
            </span>
            <span>튜토리얼 다시 보기</span>
          </button>

          <button
            className="settings-action-btn"
            onClick={() => {
              if (onUnlockAll) onUnlockAll();
            }}
            style={{ color: 'var(--accent)' }}
          >
            <span className="settings-item-icon">
              <CheckIcon size={20} color="var(--accent)" />
            </span>
            <span>🔓 모든 퍼즐 해금 (테스트용)</span>
          </button>

          <button
            className="settings-action-btn danger"
            onClick={() => setShowResetConfirm(true)}
          >
            <span className="settings-item-icon">
              <TrashIcon size={20} color="var(--danger)" />
            </span>
            <span>진행 초기화</span>
          </button>
        </div>
      </div>

      {/* 초기화 확인 다이얼로그 */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowResetConfirm(false)}>
          <div className="modal-content">
            <div className="modal-icon">
              <AlertIcon size={56} />
            </div>
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
                style={{ background: 'var(--danger)', boxShadow: '0 4px 16px rgba(239, 68, 68, 0.25)' }}
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
