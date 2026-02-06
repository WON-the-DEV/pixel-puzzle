/**
 * 일일 챌린지 — 날짜 기반 결정적 퍼즐 생성
 * 서버 없이 클라이언트만으로 매일 새로운 10x10 퍼즐 제공
 */

import { generateClues, transpose } from './puzzle.js';

// ─── Mulberry32 PRNG ───
function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── 날짜 → 시드 변환 ───
function dateToSeed(dateStr) {
  // "YYYY-MM-DD" → 정수 시드
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ─── Line Solver (유일 해 검증용) ───
// 한 줄의 clue와 현재 상태로 가능한 셀 값 계산
function solveLine(clue, line) {
  const n = line.length;
  // clue가 [0]이면 모두 X
  if (clue.length === 1 && clue[0] === 0) {
    return line.map(() => 0);
  }

  // 가능한 모든 배치를 생성하고 겹치는 부분 확인
  const groups = clue.length;
  const minLen = clue.reduce((a, b) => a + b, 0) + groups - 1;
  if (minLen > n) return null; // 불가능

  const arrangements = [];

  function generate(groupIdx, pos, current) {
    if (groupIdx === groups) {
      // 나머지는 모두 0
      const arr = [...current];
      while (arr.length < n) arr.push(0);
      // 현재 line과 호환 확인
      for (let i = 0; i < n; i++) {
        if (line[i] === 1 && arr[i] !== 1) return;
        if (line[i] === 0 && arr[i] !== 0) return;
        // line[i] === -1 (unknown)이면 아무 값 OK
      }
      arrangements.push(arr);
      return;
    }

    const remaining = groups - groupIdx - 1;
    const minNeeded = clue.slice(groupIdx + 1).reduce((a, b) => a + b, 0) + remaining;
    const maxStart = n - clue[groupIdx] - minNeeded;

    for (let start = pos; start <= maxStart; start++) {
      const arr = [...current];
      // start 전까지 0
      while (arr.length < start) arr.push(0);
      // clue 블록
      for (let k = 0; k < clue[groupIdx]; k++) arr.push(1);
      // 블록 후 1칸 빈칸 (마지막 그룹 아니면)
      if (groupIdx < groups - 1) arr.push(0);

      // 호환 확인 (지금까지)
      let valid = true;
      for (let i = 0; i < arr.length && i < n; i++) {
        if (line[i] === 1 && arr[i] !== 1) { valid = false; break; }
        if (line[i] === 0 && arr[i] !== 0) { valid = false; break; }
      }
      if (!valid) continue;

      generate(groupIdx + 1, arr.length, arr);
    }
  }

  generate(0, 0, []);

  if (arrangements.length === 0) return null;

  // 모든 arrangement에서 공통인 셀 찾기
  const result = new Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    const val = arrangements[0][i];
    let allSame = true;
    for (let a = 1; a < arrangements.length; a++) {
      if (arrangements[a][i] !== val) { allSame = false; break; }
    }
    if (allSame) result[i] = val;
  }

  return result;
}

// ─── Line Solving으로 퍼즐 풀기 ───
function solveByLineSolving(rowClues, colClues, size) {
  // -1 = unknown, 0 = empty, 1 = filled
  const grid = Array(size).fill(null).map(() => Array(size).fill(-1));
  let changed = true;
  let iterations = 0;
  const maxIterations = size * 4;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // 행 처리
    for (let r = 0; r < size; r++) {
      const line = grid[r];
      if (!line.includes(-1)) continue;
      const result = solveLine(rowClues[r], line);
      if (result === null) return null; // 모순
      for (let c = 0; c < size; c++) {
        if (line[c] === -1 && result[c] !== -1) {
          grid[r][c] = result[c];
          changed = true;
        }
      }
    }

    // 열 처리
    for (let c = 0; c < size; c++) {
      const line = grid.map(row => row[c]);
      if (!line.includes(-1)) continue;
      const result = solveLine(colClues[c], line);
      if (result === null) return null; // 모순
      for (let r = 0; r < size; r++) {
        if (grid[r][c] === -1 && result[r] !== -1) {
          grid[r][c] = result[r];
          changed = true;
        }
      }
    }
  }

  // 모든 셀이 결정되었는지 확인
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === -1) return null; // 미결정 셀 존재
    }
  }

  return grid;
}

// ─── 퍼즐 생성 ───
function generatePuzzleFromSeed(seed, size) {
  const rng = mulberry32(seed);

  // 채움률 35-50%
  const fillRate = 0.35 + rng() * 0.15;

  const solution = Array(size).fill(null).map(() =>
    Array(size).fill(null).map(() => rng() < fillRate ? 1 : 0)
  );

  // 빈 행/열 방지 — 최소 1셀 채움
  for (let i = 0; i < size; i++) {
    if (solution[i].every(c => c === 0)) {
      solution[i][Math.floor(rng() * size)] = 1;
    }
    const col = solution.map(row => row[i]);
    if (col.every(c => c === 0)) {
      solution[Math.floor(rng() * size)][i] = 1;
    }
  }

  return solution;
}

// ─── 일일 퍼즐 가져오기 ───
export function getDailyPuzzle(dateStr) {
  const baseSeed = dateToSeed(dateStr);
  const size = 10;

  // 시드 변형하면서 유일한 해를 가진 퍼즐 찾기
  for (let attempt = 0; attempt < 100; attempt++) {
    const seed = baseSeed + attempt * 7919; // 소수로 변형
    const solution = generatePuzzleFromSeed(seed, size);
    const rowClues = generateClues(solution);
    const colClues = generateClues(transpose(solution));

    // Line solving으로 풀 수 있는지 검증
    const solved = solveByLineSolving(rowClues, colClues, size);
    if (solved !== null) {
      // 풀린 결과가 원래 solution과 일치하는지 확인
      let match = true;
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (solved[r][c] !== solution[r][c]) { match = false; break; }
        }
        if (!match) break;
      }

      if (match) {
        const totalFilled = solution.flat().filter(c => c === 1).length;
        return {
          size,
          solution,
          rowClues,
          colClues,
          totalFilled,
          name: '오늘의 퍼즐',
          dateStr,
        };
      }
    }
  }

  // 만약 100번 시도해도 못 찾으면 (극히 드문 경우) 마지막 생성 퍼즐 반환
  const fallbackSeed = baseSeed + 999;
  const solution = generatePuzzleFromSeed(fallbackSeed, size);
  const rowClues = generateClues(solution);
  const colClues = generateClues(transpose(solution));
  const totalFilled = solution.flat().filter(c => c === 1).length;
  return {
    size,
    solution,
    rowClues,
    colClues,
    totalFilled,
    name: '오늘의 퍼즐',
    dateStr,
  };
}

// ─── 오늘 날짜 문자열 ───
export function getTodayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ─── 최근 N일 날짜 배열 ───
export function getRecentDates(days = 7) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${day}`);
  }
  return dates;
}

// ─── localStorage 키 ───
const DAILY_PREFIX = 'nonogram_daily_';

export function loadDailyState(dateStr) {
  try {
    const saved = localStorage.getItem(DAILY_PREFIX + dateStr);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return null;
}

export function saveDailyState(dateStr, data) {
  try {
    localStorage.setItem(DAILY_PREFIX + dateStr, JSON.stringify(data));
  } catch {
    // ignore
  }
}

// ─── 스트릭 계산 ───
export function calculateStreak() {
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;

    const state = loadDailyState(dateStr);
    if (state && state.completed) {
      streak++;
    } else {
      // 오늘은 아직 안 했어도 어제까지 연속이면 streak 유지
      if (i === 0) continue;
      break;
    }
  }

  return streak;
}

// ─── 날짜가 완료되었는지 ───
export function isDailyCompleted(dateStr) {
  const state = loadDailyState(dateStr);
  return state && state.completed;
}
