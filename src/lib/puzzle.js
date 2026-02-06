/**
 * 노노그램 퍼즐 생성 및 검증
 */

import { HANDMADE_PUZZLES } from './puzzleData.js';

// PRESET_PUZZLES — 기존 코드 호환용 (5x5 핸드메이드 퍼즐 참조)
export const PRESET_PUZZLES = HANDMADE_PUZZLES['5x5'].map(p => ({
  name: p.name,
  grid: p.solution,
}));

/**
 * 컬렉션 정의
 * 각 컬렉션은 여러 레벨을 묶어 큰 그림을 완성
 */
export const COLLECTIONS = [
  {
    id: 'beginner',
    name: '입문 마스터',
    emoji: '🌱',
    description: '입문 퍼즐 30개를 완성하세요',
    color: '#10b981',
    levels: Array.from({ length: 30 }, (_, i) => i + 1),
    gridCols: 6,
    gridRows: 5,
  },
  {
    id: 'easy',
    name: '초급 도전',
    emoji: '🌟',
    description: '초급 퍼즐 30개를 정복하세요',
    color: '#6C5CE7',
    levels: Array.from({ length: 30 }, (_, i) => i + 31),
    gridCols: 6,
    gridRows: 5,
  },
  {
    id: 'intermediate',
    name: '중급 정복',
    emoji: '💜',
    description: '중급 퍼즐 35개를 클리어하세요',
    color: '#8b5cf6',
    levels: Array.from({ length: 35 }, (_, i) => i + 61),
    gridCols: 7,
    gridRows: 5,
  },
  {
    id: 'master',
    name: '마스터',
    emoji: '🔥',
    description: '고급 퍼즐 25개를 완성하세요',
    color: '#ef4444',
    levels: Array.from({ length: 25 }, (_, i) => i + 96),
    gridCols: 5,
    gridRows: 5,
  },
];

/**
 * 행/열에서 단서(clue) 추출
 */
export function generateClues(grid) {
  return grid.map((row) => {
    const clues = [];
    let count = 0;
    for (const cell of row) {
      if (cell === 1) {
        count++;
      } else if (count > 0) {
        clues.push(count);
        count = 0;
      }
    }
    if (count > 0) clues.push(count);
    return clues.length > 0 ? clues : [0];
  });
}

/**
 * 그리드 전치 (행↔열)
 */
export function transpose(grid) {
  return grid[0].map((_, colIndex) => grid.map((row) => row[colIndex]));
}

/**
 * 시드 기반 랜덤 (일관된 퍼즐 생성)
 */
function seededRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * 랜덤 퍼즐 생성 (시드 기반)
 */
export function generateRandomPuzzle(size, seed) {
  const rng = seed != null ? seededRandom(seed) : () => Math.random();
  let solution = Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => (rng() > 0.5 ? 1 : 0))
    );

  // 최소 30% 채움 보장
  const totalCells = size * size;
  const filledCount = solution.flat().filter((c) => c === 1).length;
  if (filledCount < totalCells * 0.3) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (rng() > 0.6) solution[i][j] = 1;
      }
    }
  }

  return solution;
}

/**
 * 핸드메이드 퍼즐 레벨 매핑
 * 레벨 1-20:  5x5 입문 (20개)
 * 레벨 21-40: 8x8 초급 (20개)
 * 레벨 41-60: 10x10 중급 (20개)
 * 레벨 61-75: 15x15 고급 (15개)
 */
const LEVEL_RANGES = [
  { start: 1,  end: 30, size: 5,  key: '5x5' },
  { start: 31, end: 60, size: 8,  key: '8x8' },
  { start: 61, end: 95, size: 10, key: '10x10' },
  { start: 96, end: 120, size: 15, key: '15x15' },
];

/**
 * 총 레벨 수
 */
export const TOTAL_LEVELS = 120;

/**
 * 레벨에 따른 퍼즐 크기
 */
export function getSizeForLevel(level) {
  for (const range of LEVEL_RANGES) {
    if (level >= range.start && level <= range.end) return range.size;
  }
  return 15; // fallback
}

/**
 * 난이도별 첫 레벨인지 확인
 */
export function isSectionFirstLevel(level) {
  return LEVEL_RANGES.some(r => r.start === level);
}

/**
 * 레벨이 해금되었는지 확인
 */
export function isLevelUnlocked(level, completedLevels) {
  // 각 섹션의 첫 레벨은 항상 해금
  if (isSectionFirstLevel(level)) return true;
  // 이전 레벨이 완료되었으면 해금
  return completedLevels.includes(level - 1);
}

/**
 * 레벨에 따른 퍼즐 생성 (핸드메이드 퍼즐 사용)
 */
export function createPuzzleForLevel(level) {
  const size = getSizeForLevel(level);
  let solution;
  let name = null;

  // 핸드메이드 퍼즐에서 가져오기
  const range = LEVEL_RANGES.find(r => level >= r.start && level <= r.end);
  if (range) {
    const puzzles = HANDMADE_PUZZLES[range.key];
    const index = (level - range.start) % puzzles.length;
    const puzzle = puzzles[index];
    solution = puzzle.solution.map((row) => [...row]);
    name = puzzle.name;
  } else {
    // fallback: 시드 기반 랜덤 생성 (핸드메이드에 없는 레벨용)
    solution = generateRandomPuzzle(size, level * 12345 + 67890);
  }

  const rowClues = generateClues(solution);
  const colClues = generateClues(transpose(solution));

  // 채워야 할 셀 수 계산
  const totalFilled = solution.flat().filter((c) => c === 1).length;

  return { size, solution, rowClues, colClues, name, totalFilled };
}

/**
 * 플레이어 그리드와 솔루션 비교
 */
export function checkSolution(solution, playerGrid) {
  const size = solution.length;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const expected = solution[i][j];
      const actual = playerGrid[i][j] === 1 ? 1 : 0;
      if (expected !== actual) return false;
    }
  }
  return true;
}

/**
 * 행이 완료되었는지 확인 (solution 기반)
 */
export function isRowComplete(rowClues, playerGrid, rowIndex) {
  const row = playerGrid[rowIndex].map((c) => (c === 1 ? 1 : 0));
  const actualClues = generateClues([row])[0];
  return JSON.stringify(rowClues[rowIndex]) === JSON.stringify(actualClues);
}

/**
 * 열이 완료되었는지 확인 (solution 기반)
 */
export function isColComplete(colClues, playerGrid, colIndex) {
  const col = playerGrid.map((row) => (row[colIndex] === 1 ? 1 : 0));
  const actualClues = generateClues([col])[0];
  return JSON.stringify(colClues[colIndex]) === JSON.stringify(actualClues);
}

/**
 * 행이 solution과 정확히 일치하는지 (자동 X 판정용)
 */
export function isRowMatchesSolution(solution, playerGrid, rowIndex) {
  const size = solution[rowIndex].length;
  for (let j = 0; j < size; j++) {
    const expected = solution[rowIndex][j];
    const actual = playerGrid[rowIndex][j];
    // 채워야 하는 셀이 채워지지 않았거나, 채우면 안 되는 셀이 채워진 경우
    if (expected === 1 && actual !== 1) return false;
    if (expected === 0 && actual === 1) return false;
  }
  return true;
}

/**
 * 열이 solution과 정확히 일치하는지 (자동 X 판정용)
 */
export function isColMatchesSolution(solution, playerGrid, colIndex) {
  const size = solution.length;
  for (let i = 0; i < size; i++) {
    const expected = solution[i][colIndex];
    const actual = playerGrid[i][colIndex];
    if (expected === 1 && actual !== 1) return false;
    if (expected === 0 && actual === 1) return false;
  }
  return true;
}

/**
 * 완료된 줄의 빈칸을 자동으로 X(2)로 채우기
 * 연쇄 효과 포함: 자동 X 후 다른 줄이 완성되면 반복
 * @returns {Array} 자동으로 X가 된 셀들의 목록 [{row, col, wave}]
 */
export function autoFillCompletedLines(solution, playerGrid) {
  const size = solution.length;
  const grid = playerGrid.map(row => [...row]);
  const autoFilledCells = [];
  let wave = 0;
  let changed = true;

  while (changed) {
    changed = false;
    const waveCells = [];

    // 행 체크
    for (let i = 0; i < size; i++) {
      if (isRowMatchesSolution(solution, grid, i)) {
        for (let j = 0; j < size; j++) {
          if (solution[i][j] === 0 && grid[i][j] === 0) {
            grid[i][j] = 2;
            waveCells.push({ row: i, col: j, wave });
            changed = true;
          }
        }
      }
    }

    // 열 체크
    for (let j = 0; j < size; j++) {
      if (isColMatchesSolution(solution, grid, j)) {
        for (let i = 0; i < size; i++) {
          if (solution[i][j] === 0 && grid[i][j] === 0) {
            grid[i][j] = 2;
            waveCells.push({ row: i, col: j, wave });
            changed = true;
          }
        }
      }
    }

    if (waveCells.length > 0) {
      autoFilledCells.push(...waveCells);
      wave++;
    }
  }

  return { grid, autoFilledCells };
}

/**
 * 힌트: 아직 공개되지 않은 셀 하나 랜덤 공개
 */
export function getHint(solution, playerGrid) {
  const size = solution.length;
  const incorrectCells = [];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const expected = solution[i][j];
      const actual = playerGrid[i][j];
      if ((expected === 1 && actual !== 1) || (expected === 0 && actual === 1)) {
        incorrectCells.push({ row: i, col: j, value: expected });
      }
    }
  }

  if (incorrectCells.length === 0) return null;
  return incorrectCells[Math.floor(Math.random() * incorrectCells.length)];
}

/**
 * 현재 올바르게 채워진 셀 수
 */
export function getFilledCorrectCount(solution, playerGrid) {
  const size = solution.length;
  let count = 0;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (solution[i][j] === 1 && playerGrid[i][j] === 1) {
        count++;
      }
    }
  }
  return count;
}

/**
 * 별점 계산 (시간 기준)
 * 3★: 빠른 클리어
 * 2★: 보통
 * 1★: 느림
 */
export function calculateStars(level, timeMs) {
  const size = getSizeForLevel(level);
  const totalCells = size * size;
  const seconds = timeMs / 1000;

  // 기준: 셀 하나당 N초
  const perCell3Star = size <= 5 ? 2 : size <= 8 ? 2.5 : size <= 10 ? 3 : 3.5;
  const perCell2Star = perCell3Star * 2;

  const threshold3 = totalCells * perCell3Star;
  const threshold2 = totalCells * perCell2Star;

  if (seconds <= threshold3) return 3;
  if (seconds <= threshold2) return 2;
  return 1;
}
