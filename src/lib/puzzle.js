/**
 * 노노그램 퍼즐 생성 및 검증
 */

// 프리셋 퍼즐들 (5x5)
export const PRESET_PUZZLES = [
  {
    name: '하트',
    grid: [
      [0, 1, 0, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
  },
  {
    name: '별',
    grid: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 1, 0, 1, 0],
    ],
  },
  {
    name: '스마일',
    grid: [
      [0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 0, 0, 0, 1],
      [0, 1, 1, 1, 0],
    ],
  },
  {
    name: '집',
    grid: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1],
      [1, 1, 0, 1, 1],
    ],
  },
  {
    name: '고양이',
    grid: [
      [1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1],
      [1, 0, 1, 0, 1],
      [1, 1, 1, 1, 1],
      [0, 1, 0, 1, 0],
    ],
  },
];

/**
 * 컬렉션 정의
 * 각 컬렉션은 여러 레벨을 묶어 큰 그림을 완성
 */
export const COLLECTIONS = [
  {
    id: 'animals',
    name: '귀여운 동물',
    emoji: '🐾',
    description: '5가지 동물 퍼즐을 완성하세요',
    color: '#f97316',
    levels: [1, 2, 3, 4, 5],
    // 큰 그림: 2x3 그리드 (마지막 하나는 보너스)  
    gridCols: 3,
    gridRows: 2,
  },
  {
    id: 'beginner',
    name: '첫 걸음',
    emoji: '🌟',
    description: '초급 퍼즐 10개를 정복하세요',
    color: '#3182f6',
    levels: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    gridCols: 5,
    gridRows: 2,
  },
  {
    id: 'intermediate',
    name: '도전자',
    emoji: '💜',
    description: '중급 퍼즐 15개를 클리어하세요',
    color: '#8b5cf6',
    levels: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
    gridCols: 5,
    gridRows: 3,
  },
  {
    id: 'master',
    name: '마스터',
    emoji: '🔥',
    description: '고급 퍼즐 20개를 완성하세요',
    color: '#ef4444',
    levels: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
    gridCols: 5,
    gridRows: 4,
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
 * 레벨에 따른 퍼즐 크기
 */
export function getSizeForLevel(level) {
  if (level <= 5) return 5;
  if (level <= 15) return 8;
  if (level <= 30) return 10;
  return 15;
}

/**
 * 난이도별 첫 레벨인지 확인
 */
export function isSectionFirstLevel(level) {
  return level === 1 || level === 6 || level === 16 || level === 31;
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
 * 레벨에 따른 퍼즐 생성
 */
export function createPuzzleForLevel(level) {
  const size = getSizeForLevel(level);
  let solution;
  let name = null;

  if (level <= 5) {
    const preset = PRESET_PUZZLES[(level - 1) % PRESET_PUZZLES.length];
    solution = preset.grid.map((row) => [...row]);
    name = preset.name;
  } else {
    // 시드 기반으로 동일한 퍼즐 생성
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
