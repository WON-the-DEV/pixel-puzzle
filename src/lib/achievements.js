/**
 * 성취(업적) 시스템
 */

const STORAGE_KEY = 'nonogram_achievements';

const ACHIEVEMENTS = [
  { id: 'first_clear', name: '첫 걸음', desc: '첫 번째 퍼즐 완료', icon: '🎯' },
  { id: 'perfect_5', name: '완벽주의자', desc: '5x5 퍼즐 실수 없이 완료', icon: '💎' },
  { id: 'speed_demon', name: '스피드 러너', desc: '5x5를 30초 안에 완료', icon: '⚡' },
  { id: 'marathon', name: '마라톤', desc: '10개 퍼즐 연속 완료', icon: '🏃' },
  { id: 'collector', name: '컬렉터', desc: '컬렉션 1개 완성', icon: '🖼️' },
  { id: 'daily_7', name: '일주일', desc: '일일 챌린지 7일 연속', icon: '🔥' },
  { id: 'half_way', name: '반쯤 왔다', desc: '75개 퍼즐 완료', icon: '🏔️' },
  { id: 'master', name: '노노그램 마스터', desc: '150개 퍼즐 전체 완료', icon: '👑' },
  { id: 'three_star_all_5x5', name: '입문 마스터', desc: '5x5 전체 ⭐⭐⭐', icon: '🌟' },
  { id: 'dark_player', name: '야행성', desc: '다크 모드로 10개 완료', icon: '🌙' },
];

export function getAllAchievements() {
  return ACHIEVEMENTS;
}

export function loadUnlockedAchievements() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {};
}

export function saveUnlockedAchievements(unlocked) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked));
  } catch { /* ignore */ }
}

/**
 * 성취 조건 체크 — 새로 달성된 성취 ID 배열 반환
 * @param {object} context — 현재 게임 상태 정보
 *   - completedLevels: number[]
 *   - bestStars: { [level]: stars }
 *   - bestTimes: { [level]: ms }
 *   - collectionProgress: { completedTiles: string[] }
 *   - level: number (방금 완료한 레벨, 0=일일)
 *   - lives: number (남은 라이프)
 *   - maxLives: number
 *   - elapsedTime: number (ms)
 *   - isDark: boolean
 *   - isDaily: boolean
 *   - puzzleSize: number
 * @returns {string[]} 새로 달성된 성취 ID 배열
 */
export function checkAchievements(context) {
  const unlocked = loadUnlockedAchievements();
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlocked[ach.id]) continue; // 이미 달성

    let earned = false;

    switch (ach.id) {
      case 'first_clear':
        earned = context.completedLevels.length >= 1;
        break;

      case 'perfect_5':
        // 5x5 퍼즐을 실수 없이 (lives === maxLives) 완료
        earned = context.puzzleSize === 5 && context.lives === context.maxLives && !context.isDaily;
        break;

      case 'speed_demon':
        // 5x5를 30초 안에 완료
        earned = context.puzzleSize === 5 && context.elapsedTime <= 30000 && !context.isDaily;
        break;

      case 'marathon': {
        // 10개 퍼즐 연속 완료 — 최근 연속 레벨 체크
        earned = checkMarathon(context.completedLevels);
        break;
      }

      case 'collector': {
        // 컬렉션 1개 완성
        earned = checkCollectionComplete(context.collectionProgress);
        break;
      }

      case 'daily_7':
        earned = context.dailyStreak >= 7;
        break;

      case 'half_way':
        earned = context.completedLevels.length >= 75;
        break;

      case 'master':
        earned = context.completedLevels.length >= 150;
        break;

      case 'three_star_all_5x5': {
        // 5x5 전체 (레벨 1-30) ⭐⭐⭐
        earned = true;
        for (let l = 1; l <= 30; l++) {
          if ((context.bestStars[l] || 0) < 3) {
            earned = false;
            break;
          }
        }
        break;
      }

      case 'dark_player': {
        // 다크 모드로 10개 완료
        const darkCount = loadDarkModeCount();
        earned = darkCount >= 10;
        break;
      }
    }

    if (earned) {
      unlocked[ach.id] = Date.now();
      newlyUnlocked.push(ach.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveUnlockedAchievements(unlocked);
  }

  return newlyUnlocked;
}

// ─── 마라톤 체크: 10개 연속 레벨 존재? ───
function checkMarathon(completedLevels) {
  if (completedLevels.length < 10) return false;
  const sorted = [...completedLevels].sort((a, b) => a - b);
  let consecutive = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      consecutive++;
      if (consecutive >= 10) return true;
    } else {
      consecutive = 1;
    }
  }
  return false;
}

// ─── 컬렉션 완성 체크 ───
function checkCollectionComplete(collectionProgress) {
  if (!collectionProgress || !collectionProgress.completedTiles) return false;
  // 각 컬렉션 ID별 필요 타일 수 (collections.js의 COLLECTION_DATA와 동기화)
  const collectionSizes = {
    heart: 9,    // 3x3
    cat: 16,     // 4x4
    flower: 9,   // 3x3
    rocket: 9,   // 3x3
    tree: 9,     // 3x3
    turtle: 12,  // 3x4
    food: 12,    // 4x3
  };

  const counts = {};
  for (const key of collectionProgress.completedTiles) {
    const colId = key.split('-')[0];
    counts[colId] = (counts[colId] || 0) + 1;
  }

  for (const [colId, needed] of Object.entries(collectionSizes)) {
    if ((counts[colId] || 0) >= needed) return true;
  }

  return false;
}

// ─── 다크 모드 완료 카운트 ───
const DARK_COUNT_KEY = 'nonogram_dark_completions';

export function loadDarkModeCount() {
  try {
    const val = localStorage.getItem(DARK_COUNT_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch { return 0; }
}

export function incrementDarkModeCount() {
  try {
    const current = loadDarkModeCount();
    localStorage.setItem(DARK_COUNT_KEY, String(current + 1));
    return current + 1;
  } catch { return 0; }
}

/**
 * 성취 정보 가져오기
 */
export function getAchievementById(id) {
  return ACHIEVEMENTS.find(a => a.id === id);
}
