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
 * 랜덤 퍼즐 생성
 */
export function generateRandomPuzzle(size) {
  let solution = Array(size)
    .fill(null)
    .map(() =>
      Array(size)
        .fill(null)
        .map(() => (Math.random() > 0.5 ? 1 : 0))
    );

  // 최소 30% 채움 보장
  const totalCells = size * size;
  const filledCount = solution.flat().filter((c) => c === 1).length;
  if (filledCount < totalCells * 0.3) {
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (Math.random() > 0.6) solution[i][j] = 1;
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
    solution = generateRandomPuzzle(size);
  }

  const rowClues = generateClues(solution);
  const colClues = generateClues(transpose(solution));

  return { size, solution, rowClues, colClues, name };
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
 * 행이 완료되었는지 확인
 */
export function isRowComplete(rowClues, playerGrid, rowIndex) {
  const row = playerGrid[rowIndex].map((c) => (c === 1 ? 1 : 0));
  const actualClues = generateClues([row])[0];
  return JSON.stringify(rowClues[rowIndex]) === JSON.stringify(actualClues);
}

/**
 * 열이 완료되었는지 확인
 */
export function isColComplete(colClues, playerGrid, colIndex) {
  const col = playerGrid.map((row) => (row[colIndex] === 1 ? 1 : 0));
  const actualClues = generateClues([col])[0];
  return JSON.stringify(colClues[colIndex]) === JSON.stringify(actualClues);
}

/**
 * 힌트: 틀린 셀 하나 공개
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
