import { useState, useMemo } from 'react';
import { BackIcon } from './icons/Icons.jsx';
import { TOTAL_LEVELS, getSizeForLevel } from '../lib/puzzle.js';
import { loadDailyState, calculateStreak } from '../lib/dailyChallenge.js';
import { getAllAchievements, loadUnlockedAchievements } from '../lib/achievements.js';
import { COLLECTION_DATA } from '../lib/collections.js';

/**
 * 통계 + 성취 화면
 */

// ─── 통계 데이터 수집 ───
function collectStats(appState, collectionProgress) {
  const { completedLevels = [], bestTimes = {}, bestStars = {} } = appState;

  // 총 완료 퍼즐 수
  const totalCompleted = completedLevels.length;

  // 총 플레이 시간
  const stats = loadNonogramStats();
  const totalPlayTime = stats.totalPlayTime || 0;

  // 완벽 클리어 횟수
  const perfectCount = stats.perfectCount || 0;

  // 최고 연속 일일 챌린지 스트릭
  const dailyStreak = calculateStreak();

  // 별 총 개수
  let totalStars = 0;
  for (const level of completedLevels) {
    totalStars += bestStars[level] || 1;
  }

  // 평균 클리어 시간 (크기별)
  const sizeGroups = {}; // { '5x5': [time1, time2, ...] }
  for (const [levelStr, time] of Object.entries(bestTimes)) {
    const level = parseInt(levelStr, 10);
    const size = getSizeForLevel(level);
    const key = `${size}×${size}`;
    if (!sizeGroups[key]) sizeGroups[key] = [];
    sizeGroups[key].push(time);
  }
  const avgTimes = {};
  for (const [key, times] of Object.entries(sizeGroups)) {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    avgTimes[key] = avg;
  }

  // 컬렉션 완료 수
  const completedCollections = countCompletedCollections(collectionProgress);

  return {
    totalCompleted,
    totalPlayTime,
    perfectCount,
    dailyStreak,
    totalStars,
    avgTimes,
    completedCollections,
  };
}

function loadNonogramStats() {
  try {
    const saved = localStorage.getItem('nonogram_stats');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {};
}

function getContentTileCount(collection) {
  let count = 0;
  for (let tr = 0; tr < collection.tileRows; tr++) {
    for (let tc = 0; tc < collection.tileCols; tc++) {
      const startR = tr * collection.tileSize;
      const startC = tc * collection.tileSize;
      let hasFilled = false;
      for (let r = startR; r < startR + collection.tileSize && r < collection.bigPicture.length; r++) {
        for (let c = startC; c < startC + collection.tileSize && c < collection.bigPicture[0].length; c++) {
          if (collection.bigPicture[r][c] > 0) { hasFilled = true; break; }
        }
        if (hasFilled) break;
      }
      if (hasFilled) count++;
    }
  }
  return count;
}

function countCompletedCollections(collectionProgress) {
  if (!collectionProgress || !collectionProgress.completedTiles) return 0;
  const counts = {};
  for (const key of collectionProgress.completedTiles) {
    const colId = key.split('-')[0];
    counts[colId] = (counts[colId] || 0) + 1;
  }
  let completed = 0;
  for (const col of COLLECTION_DATA) {
    const needed = getContentTileCount(col);
    if (needed > 0 && (counts[col.id] || 0) >= needed) completed++;
  }
  return completed;
}

// ─── 시간 포맷 ───
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}초`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}분 ${seconds}초`;
  const hours = Math.floor(minutes / 60);
  const remainMinutes = minutes % 60;
  return `${hours}시간 ${remainMinutes}분`;
}

function formatAvgTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}초`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function StatsScreen({ appState, collectionProgress, onGoBack }) {
  const [tab, setTab] = useState('stats'); // 'stats' | 'achievements'
  const stats = useMemo(() => collectStats(appState, collectionProgress), [appState, collectionProgress]);
  const achievements = getAllAchievements();
  const unlocked = useMemo(() => loadUnlockedAchievements(), []);

  const unlockedCount = Object.keys(unlocked).length;

  return (
    <div className="stats-screen">
      <header className="settings-header">
        <button className="back-btn" onClick={onGoBack} aria-label="뒤로">
          <BackIcon size={24} />
        </button>
        <h1 className="settings-title">📊 내 기록</h1>
        <div style={{ width: 40 }} />
      </header>

      {/* 탭 전환 */}
      <div className="stats-tab-bar">
        <button
          className={`stats-tab ${tab === 'stats' ? 'active' : ''}`}
          onClick={() => setTab('stats')}
        >
          통계
        </button>
        <button
          className={`stats-tab ${tab === 'achievements' ? 'active' : ''}`}
          onClick={() => setTab('achievements')}
        >
          업적 ({unlockedCount}/{achievements.length})
        </button>
      </div>

      <div className="stats-body">
        {tab === 'stats' ? (
          <StatsView stats={stats} />
        ) : (
          <AchievementsView achievements={achievements} unlocked={unlocked} />
        )}
      </div>
    </div>
  );
}

function StatsView({ stats }) {
  return (
    <div className="stats-grid">
      <StatCard
        icon="🧩"
        value={`${stats.totalCompleted}`}
        sub={`/ ${TOTAL_LEVELS}`}
        label="완료 퍼즐"
      />
      <StatCard
        icon="⏱️"
        value={stats.totalPlayTime > 0 ? formatTime(stats.totalPlayTime) : '—'}
        label="총 플레이 시간"
      />
      <StatCard
        icon="💎"
        value={`${stats.perfectCount}`}
        label="완벽 클리어"
      />
      <StatCard
        icon="🔥"
        value={`${stats.dailyStreak}`}
        sub="일"
        label="최고 연속 스트릭"
      />
      <StatCard
        icon="⭐"
        value={`${stats.totalStars}`}
        label="별 총 개수"
      />
      <StatCard
        icon="🖼️"
        value={`${stats.completedCollections}`}
        sub={`/ ${COLLECTION_DATA.length}`}
        label="컬렉션 완료"
      />

      {/* 평균 클리어 시간 (크기별) */}
      {Object.keys(stats.avgTimes).length > 0 && (
        <div className="stats-section-wide">
          <div className="stats-section-title">⏱️ 평균 클리어 시간</div>
          <div className="stats-avg-grid">
            {Object.entries(stats.avgTimes)
              .sort((a, b) => {
                const sizeA = parseInt(a[0]);
                const sizeB = parseInt(b[0]);
                return sizeA - sizeB;
              })
              .map(([key, avg]) => (
                <div key={key} className="stats-avg-item">
                  <span className="stats-avg-size">{key}</span>
                  <span className="stats-avg-time">{formatAvgTime(avg)}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, sub, label }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-value">
        {value}
        {sub && <span className="stat-card-sub">{sub}</span>}
      </div>
      <div className="stat-card-label">{label}</div>
    </div>
  );
}

function AchievementsView({ achievements, unlocked }) {
  return (
    <div className="achievements-list">
      {achievements.map((ach) => {
        const isUnlocked = !!unlocked[ach.id];
        const unlockedAt = unlocked[ach.id];
        return (
          <div
            key={ach.id}
            className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="achievement-icon-wrap">
              <span className={`achievement-icon ${isUnlocked ? '' : 'grayscale'}`}>
                {ach.icon}
              </span>
            </div>
            <div className="achievement-info">
              <div className="achievement-name">{ach.name}</div>
              <div className="achievement-desc">{ach.desc}</div>
              {isUnlocked && unlockedAt && (
                <div className="achievement-date">
                  {new Date(unlockedAt).toLocaleDateString('ko-KR')}
                </div>
              )}
            </div>
            <div className="achievement-status">
              {isUnlocked ? '✅' : '🔒'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
