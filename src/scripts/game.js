/**
 * 노노그램 게임 상태 관리
 */

import { Puzzle, PRESET_PUZZLES } from './puzzle.js';

export class Game {
  constructor() {
    this.puzzle = null;
    this.playerGrid = [];
    this.level = 1;
    this.mode = 'fill'; // 'fill' or 'mark'
    this.history = [];
    this.historyIndex = -1;
    this.hints = 3;
    this.startTime = null;
    this.elapsedTime = 0;
    this.isComplete = false;
    
    this.onUpdate = null; // 콜백
    this.onComplete = null;
  }

  /**
   * 새 게임 시작
   */
  startLevel(level = 1) {
    this.level = level;
    this.isComplete = false;
    
    // 레벨에 따른 사이즈 결정
    let size;
    if (level <= 5) {
      size = 5;
      // 프리셋 사용
      const presetIndex = (level - 1) % PRESET_PUZZLES.length;
      this.puzzle = Puzzle.fromPreset(PRESET_PUZZLES[presetIndex]);
    } else if (level <= 15) {
      size = 8;
      this.puzzle = new Puzzle(size);
    } else if (level <= 30) {
      size = 10;
      this.puzzle = new Puzzle(size);
    } else {
      size = 15;
      this.puzzle = new Puzzle(size);
    }
    
    // 플레이어 그리드 초기화 (0 = 빈칸, 1 = 채움, 2 = X표시)
    this.playerGrid = Array(this.puzzle.size).fill(null).map(() =>
      Array(this.puzzle.size).fill(0)
    );
    
    // 히스토리 초기화
    this.history = [this.cloneGrid()];
    this.historyIndex = 0;
    
    // 타이머 시작
    this.startTime = Date.now();
    this.elapsedTime = 0;
    
    this.notifyUpdate();
  }

  /**
   * 셀 클릭 처리
   */
  toggleCell(row, col) {
    if (this.isComplete) return;
    
    const current = this.playerGrid[row][col];
    
    if (this.mode === 'fill') {
      // 색칠 모드: 빈칸 → 채움 → 빈칸
      this.playerGrid[row][col] = current === 1 ? 0 : 1;
    } else {
      // X 모드: 빈칸 → X → 빈칸
      this.playerGrid[row][col] = current === 2 ? 0 : 2;
    }
    
    this.saveHistory();
    this.checkComplete();
    this.notifyUpdate();
  }

  /**
   * 드래그로 여러 셀 처리
   */
  fillCell(row, col, value) {
    if (this.isComplete) return;
    if (this.playerGrid[row][col] === value) return;
    
    this.playerGrid[row][col] = value;
    this.notifyUpdate();
  }

  /**
   * 드래그 종료 시 히스토리 저장
   */
  endDrag() {
    this.saveHistory();
    this.checkComplete();
  }

  /**
   * 모드 전환
   */
  toggleMode() {
    this.mode = this.mode === 'fill' ? 'mark' : 'fill';
    this.notifyUpdate();
  }

  /**
   * Undo
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.playerGrid = this.cloneGrid(this.history[this.historyIndex]);
      this.notifyUpdate();
    }
  }

  /**
   * Redo
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.playerGrid = this.cloneGrid(this.history[this.historyIndex]);
      this.notifyUpdate();
    }
  }

  /**
   * 힌트 사용
   */
  useHint() {
    if (this.hints <= 0 || this.isComplete) return false;
    
    const hint = this.puzzle.getHint(this.playerGrid);
    if (!hint) return false;
    
    this.playerGrid[hint.row][hint.col] = hint.value === 1 ? 1 : 2;
    this.hints--;
    this.saveHistory();
    this.checkComplete();
    this.notifyUpdate();
    
    return true;
  }

  /**
   * 완료 체크
   */
  checkComplete() {
    if (this.puzzle.checkSolution(this.playerGrid)) {
      this.isComplete = true;
      this.elapsedTime = Date.now() - this.startTime;
      
      if (this.onComplete) {
        this.onComplete({
          level: this.level,
          time: this.elapsedTime,
          size: this.puzzle.size
        });
      }
    }
  }

  /**
   * 행 완료 여부
   */
  isRowComplete(rowIndex) {
    return this.puzzle.isRowComplete(this.playerGrid, rowIndex);
  }

  /**
   * 열 완료 여부
   */
  isColComplete(colIndex) {
    return this.puzzle.isColComplete(this.playerGrid, colIndex);
  }

  /**
   * 히스토리 저장
   */
  saveHistory() {
    // 현재 위치 이후 히스토리 삭제
    this.history = this.history.slice(0, this.historyIndex + 1);
    // 새 상태 추가
    this.history.push(this.cloneGrid());
    this.historyIndex = this.history.length - 1;
    
    // 히스토리 제한 (100개)
    if (this.history.length > 100) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * 그리드 복사
   */
  cloneGrid(grid = this.playerGrid) {
    return grid.map(row => [...row]);
  }

  /**
   * 경과 시간 (밀리초)
   */
  getElapsedTime() {
    if (this.isComplete) {
      return this.elapsedTime;
    }
    return this.startTime ? Date.now() - this.startTime : 0;
  }

  /**
   * 업데이트 알림
   */
  notifyUpdate() {
    if (this.onUpdate) {
      this.onUpdate(this);
    }
  }

  /**
   * 게임 상태 저장
   */
  save() {
    return {
      level: this.level,
      playerGrid: this.playerGrid,
      hints: this.hints,
      elapsedTime: this.getElapsedTime()
    };
  }

  /**
   * 게임 상태 복원
   */
  load(data) {
    this.startLevel(data.level);
    this.playerGrid = data.playerGrid;
    this.hints = data.hints;
    this.startTime = Date.now() - data.elapsedTime;
    this.notifyUpdate();
  }
}
