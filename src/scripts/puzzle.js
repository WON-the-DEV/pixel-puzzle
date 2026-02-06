/**
 * 노노그램 퍼즐 생성 및 검증
 */

export class Puzzle {
  constructor(size = 5) {
    this.size = size;
    this.solution = [];
    this.rowClues = [];
    this.colClues = [];
    this.generate();
  }

  /**
   * 랜덤 퍼즐 생성
   */
  generate() {
    // 솔루션 그리드 생성 (0 = 빈칸, 1 = 채움)
    this.solution = Array(this.size).fill(null).map(() =>
      Array(this.size).fill(null).map(() => Math.random() > 0.5 ? 1 : 0)
    );

    // 최소한 일부는 채워져 있도록 보장
    const totalCells = this.size * this.size;
    const filledCount = this.solution.flat().filter(c => c === 1).length;
    
    if (filledCount < totalCells * 0.3) {
      // 30% 미만이면 더 채우기
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (Math.random() > 0.6) {
            this.solution[i][j] = 1;
          }
        }
      }
    }

    // 단서 생성
    this.rowClues = this.generateClues(this.solution);
    this.colClues = this.generateClues(this.transpose(this.solution));
  }

  /**
   * 프리셋 퍼즐 로드
   */
  static fromPreset(preset) {
    const puzzle = new Puzzle(preset.length);
    puzzle.solution = preset;
    puzzle.rowClues = puzzle.generateClues(preset);
    puzzle.colClues = puzzle.generateClues(puzzle.transpose(preset));
    return puzzle;
  }

  /**
   * 행/열에서 단서 추출
   */
  generateClues(grid) {
    return grid.map(row => {
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
      
      if (count > 0) {
        clues.push(count);
      }
      
      return clues.length > 0 ? clues : [0];
    });
  }

  /**
   * 그리드 전치 (행↔열)
   */
  transpose(grid) {
    return grid[0].map((_, colIndex) => grid.map(row => row[colIndex]));
  }

  /**
   * 플레이어 그리드와 솔루션 비교
   */
  checkSolution(playerGrid) {
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const expected = this.solution[i][j];
        const actual = playerGrid[i][j] === 1 ? 1 : 0;
        if (expected !== actual) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * 행이 완료되었는지 확인
   */
  isRowComplete(playerGrid, rowIndex) {
    const row = playerGrid[rowIndex];
    const clues = this.rowClues[rowIndex];
    const actualClues = this.generateClues([row.map(c => c === 1 ? 1 : 0)])[0];
    return JSON.stringify(clues) === JSON.stringify(actualClues);
  }

  /**
   * 열이 완료되었는지 확인
   */
  isColComplete(playerGrid, colIndex) {
    const col = playerGrid.map(row => row[colIndex]);
    const clues = this.colClues[colIndex];
    const actualClues = this.generateClues([col.map(c => c === 1 ? 1 : 0)])[0];
    return JSON.stringify(clues) === JSON.stringify(actualClues);
  }

  /**
   * 힌트: 랜덤 셀 하나 공개
   */
  getHint(playerGrid) {
    const incorrectCells = [];
    
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const expected = this.solution[i][j];
        const actual = playerGrid[i][j];
        
        // 틀린 셀 또는 빈 셀 중 채워야 하는 셀
        if ((expected === 1 && actual !== 1) || (expected === 0 && actual === 1)) {
          incorrectCells.push({ row: i, col: j, value: expected });
        }
      }
    }
    
    if (incorrectCells.length === 0) return null;
    
    // 랜덤하게 하나 선택
    return incorrectCells[Math.floor(Math.random() * incorrectCells.length)];
  }
}

// 프리셋 퍼즐들 (5x5)
export const PRESET_PUZZLES = [
  // 하트
  [
    [0, 1, 0, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 0, 1, 0, 0]
  ],
  // 별
  [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [0, 1, 1, 1, 0],
    [0, 1, 0, 1, 0]
  ],
  // 스마일
  [
    [0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
  ],
  // 집
  [
    [0, 0, 1, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 0, 1, 1]
  ],
  // 고양이
  [
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 1, 0, 1],
    [1, 1, 1, 1, 1],
    [0, 1, 0, 1, 0]
  ]
];
