import { useReducer, useCallback, useEffect } from 'react';
import {
  createPuzzleForLevel,
  checkSolution,
  getHint,
  autoFillCompletedLines,
  getFilledCorrectCount,
} from '../lib/puzzle.js';
import { loadGameSave, saveGameProgress, clearGameSave } from '../lib/storage.js';

// 0 = empty, 1 = filled, 2 = X mark, 3 = mistake flash (temporary)
const INITIAL_STATE = {
  level: 1,
  puzzle: null, // { size, solution, rowClues, colClues, name, totalFilled }
  playerGrid: [],
  mode: 'fill', // 'fill' | 'mark'
  history: [],
  historyIndex: -1,
  startTime: null,
  elapsedTime: 0,
  isComplete: false,
  // 라이프 시스템
  lives: 3,
  maxLives: 3,
  isGameOver: false,
  // 자동 X 표시 셀 (애니메이션용)
  autoXCells: [],
  // 진행률
  filledCorrect: 0,
  // 실수 플래시 셀 (빨간색으로 잠깐 표시 후 X로 변환)
  mistakeFlashCells: [],
  // 광고 부활 사용 여부
  usedRevive: false,
};

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function createEmptyGrid(size) {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(0));
}

function processAutoFill(state, grid) {
  const { grid: newGrid, autoFilledCells } = autoFillCompletedLines(
    state.puzzle.solution,
    grid
  );
  return { newGrid, autoFilledCells };
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'START_LEVEL': {
      const level = action.level;
      const puzzle = createPuzzleForLevel(level);

      // 저장된 진행 상황 복원 시도
      const saved = loadGameSave();
      if (saved && saved.level === level && saved.playerGrid) {
        const filledCorrect = getFilledCorrectCount(puzzle.solution, saved.playerGrid);
        return {
          ...state,
          level,
          puzzle,
          playerGrid: saved.playerGrid,
          mode: saved.mode || 'fill',
          history: [cloneGrid(saved.playerGrid)],
          historyIndex: 0,
          startTime: Date.now() - (saved.elapsedTime || 0),
          elapsedTime: saved.elapsedTime || 0,
          isComplete: false,
          lives: saved.lives != null ? saved.lives : 3,
          maxLives: 3,
          isGameOver: false,
          autoXCells: [],
          filledCorrect,
          mistakeFlashCells: [],
          usedRevive: saved.usedRevive || false,
        };
      }

      const playerGrid = createEmptyGrid(puzzle.size);

      // 단서가 [0]인 행/열은 시작부터 X(2)로 채우기
      for (let i = 0; i < puzzle.size; i++) {
        if (puzzle.rowClues[i].length === 1 && puzzle.rowClues[i][0] === 0) {
          for (let j = 0; j < puzzle.size; j++) playerGrid[i][j] = 2;
        }
      }
      for (let j = 0; j < puzzle.size; j++) {
        if (puzzle.colClues[j].length === 1 && puzzle.colClues[j][0] === 0) {
          for (let i = 0; i < puzzle.size; i++) playerGrid[i][j] = 2;
        }
      }

      return {
        ...state,
        level,
        puzzle,
        playerGrid,
        mode: 'fill',
        history: [cloneGrid(playerGrid)],
        historyIndex: 0,
        startTime: Date.now(),
        elapsedTime: 0,
        isComplete: false,
        lives: 3,
        maxLives: 3,
        isGameOver: false,
        autoXCells: [],
        filledCorrect: 0,
        mistakeFlashCells: [],
        usedRevive: false,
      };
    }

    case 'TOGGLE_CELL': {
      if (state.isComplete || state.isGameOver) return state;
      const { row, col } = action;
      const newGrid = cloneGrid(state.playerGrid);
      const current = newGrid[row][col];

      let newLives = state.lives;
      let isGameOver = false;
      let lostLife = false;
      let mistakeFlashCells = [];

      if (state.mode === 'fill') {
        // X 표시된 셀은 fill 모드에서 무시 (목숨 보호)
        if (current === 2) {
          return state;
        }
        if (current === 1) {
          // 이미 채워진 셀 해제
          newGrid[row][col] = 0;
        } else {
          // 채우기 — solution 확인
          const expected = state.puzzle.solution[row][col];
          if (expected === 1) {
            newGrid[row][col] = 1;
          } else {
            // 잘못된 셀! 라이프 감소
            newLives = Math.max(0, state.lives - 1);
            lostLife = true;
            if (newLives === 0) {
              isGameOver = true;
            }
            // 실수 플래시: 잠깐 빨간색으로 표시 후 X로 변환
            newGrid[row][col] = 2;
            mistakeFlashCells = [{ row, col }];
          }
        }
      } else {
        // X 모드: X 토글
        newGrid[row][col] = current === 2 ? 0 : 2;
      }

      // 자동 X 채우기
      const { newGrid: autoGrid, autoFilledCells } = processAutoFill(state, newGrid);

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();

      const isComplete = !isGameOver && checkSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);

      return {
        ...state,
        playerGrid: autoGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        lives: newLives,
        isGameOver,
        lostLife,
        autoXCells: autoFilledCells,
        filledCorrect,
        mistakeFlashCells,
      };
    }

    case 'FILL_CELL': {
      if (state.isComplete || state.isGameOver) return state;
      const { row, col, value } = action;
      if (state.playerGrid[row][col] === value) return state;
      // 이미 X(2)인 셀은 무시 — 추가 라이프 감소 없음
      if (state.playerGrid[row][col] === 2) return state;
      // 이미 채워진(1) 셀도 무시
      if (state.playerGrid[row][col] === 1) return state;

      const newGrid = cloneGrid(state.playerGrid);
      if (value === 1) {
        const expected = state.puzzle.solution[row][col];
        if (expected !== 1) {
          // 틀림 — 라이프 감소 + X 표시
          const newLives = Math.max(0, state.lives - 1);
          newGrid[row][col] = 2;
          if (newLives === 0) {
            return { ...state, playerGrid: newGrid, lives: newLives, isGameOver: true, lostLife: true };
          }
          return { ...state, playerGrid: newGrid, lives: newLives, lostLife: true };
        }
      }
      newGrid[row][col] = value;

      // 자동 X 채우기 (드래그 중에도 즉시 반영)
      const { newGrid: autoGridFill, autoFilledCells: autoFilledFill } = processAutoFill(state, newGrid);
      const filledCorrectFill = getFilledCorrectCount(state.puzzle.solution, autoGridFill);

      return { ...state, playerGrid: autoGridFill, autoXCells: autoFilledFill, filledCorrect: filledCorrectFill };
    }

    case 'END_DRAG': {
      if (state.isGameOver) return state;

      // 드래그 끝날 때 자동 X 처리
      const { newGrid: autoGrid, autoFilledCells } = processAutoFill(state, state.playerGrid);

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();

      const isComplete = checkSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);

      return {
        ...state,
        playerGrid: autoGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        autoXCells: autoFilledCells,
        filledCorrect,
      };
    }

    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'fill' ? 'mark' : 'fill' };

    case 'UNDO': {
      if (state.historyIndex <= 0 || state.isGameOver) return state;
      const newIndex = state.historyIndex - 1;
      const grid = cloneGrid(state.history[newIndex]);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, grid);
      return {
        ...state,
        playerGrid: grid,
        historyIndex: newIndex,
        autoXCells: [],
        filledCorrect,
        mistakeFlashCells: [],
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1 || state.isGameOver) return state;
      const newIndex = state.historyIndex + 1;
      const grid = cloneGrid(state.history[newIndex]);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, grid);
      return {
        ...state,
        playerGrid: grid,
        historyIndex: newIndex,
        autoXCells: [],
        filledCorrect,
        mistakeFlashCells: [],
      };
    }

    case 'USE_HINT': {
      if (state.isComplete || state.isGameOver) return state;
      // hints는 App에서 관리하므로 여기서는 실행만
      const hint = getHint(state.puzzle.solution, state.playerGrid);
      if (!hint) return state;

      const newGrid = cloneGrid(state.playerGrid);
      newGrid[hint.row][hint.col] = hint.value === 1 ? 1 : 2;

      // 자동 X 처리
      const { newGrid: autoGrid, autoFilledCells } = processAutoFill(state, newGrid);

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(autoGrid));
      if (newHistory.length > 100) newHistory.shift();

      const isComplete = checkSolution(state.puzzle.solution, autoGrid);
      const filledCorrect = getFilledCorrectCount(state.puzzle.solution, autoGrid);

      return {
        ...state,
        playerGrid: autoGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
        autoXCells: autoFilledCells,
        filledCorrect,
        mistakeFlashCells: [],
      };
    }

    case 'CLEAR_AUTO_X':
      return { ...state, autoXCells: [], lostLife: false, mistakeFlashCells: [] };

    case 'REVIVE': {
      if (!state.isGameOver || state.usedRevive) return state;
      return { ...state, lives: 1, isGameOver: false, usedRevive: true, lostLife: false };
    }

    case 'RESTART_LEVEL': {
      const puzzle = state.puzzle;
      if (!puzzle) return state;
      clearGameSave();
      const playerGrid = createEmptyGrid(puzzle.size);

      // 단서가 [0]인 행/열은 시작부터 X(2)로 채우기
      for (let i = 0; i < puzzle.size; i++) {
        if (puzzle.rowClues[i].length === 1 && puzzle.rowClues[i][0] === 0) {
          for (let j = 0; j < puzzle.size; j++) playerGrid[i][j] = 2;
        }
      }
      for (let j = 0; j < puzzle.size; j++) {
        if (puzzle.colClues[j].length === 1 && puzzle.colClues[j][0] === 0) {
          for (let i = 0; i < puzzle.size; i++) playerGrid[i][j] = 2;
        }
      }

      return {
        ...state,
        playerGrid,
        mode: 'fill',
        history: [cloneGrid(playerGrid)],
        historyIndex: 0,
        startTime: Date.now(),
        elapsedTime: 0,
        isComplete: false,
        lives: 3,
        maxLives: 3,
        isGameOver: false,
        autoXCells: [],
        filledCorrect: 0,
        mistakeFlashCells: [],
        usedRevive: false,
      };
    }

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

  // 자동 저장: 게임 진행 중 셀 변경 시
  useEffect(() => {
    if (!state.puzzle || state.isComplete || state.isGameOver) {
      // 완료/게임오버 시 저장 삭제
      if (state.isComplete) clearGameSave();
      return;
    }
    // playerGrid가 있을 때만 저장
    if (state.playerGrid && state.playerGrid.length > 0) {
      saveGameProgress({
        level: state.level,
        playerGrid: state.playerGrid,
        mode: state.mode,
        lives: state.lives,
        elapsedTime: state.startTime ? Date.now() - state.startTime : 0,
        usedRevive: state.usedRevive,
      });
    }
  }, [state.playerGrid, state.level, state.isComplete, state.isGameOver, state.lives, state.mode]);

  const startLevel = useCallback((level) => {
    dispatch({ type: 'START_LEVEL', level });
  }, []);

  const toggleCell = useCallback((row, col) => {
    dispatch({ type: 'TOGGLE_CELL', row, col });
  }, []);

  const fillCell = useCallback((row, col, value) => {
    dispatch({ type: 'FILL_CELL', row, col, value });
  }, []);

  const endDrag = useCallback(() => {
    dispatch({ type: 'END_DRAG' });
  }, []);

  const toggleMode = useCallback(() => {
    dispatch({ type: 'TOGGLE_MODE' });
  }, []);

  const useHint = useCallback(() => {
    dispatch({ type: 'USE_HINT' });
  }, []);

  const clearAutoX = useCallback(() => {
    dispatch({ type: 'CLEAR_AUTO_X' });
  }, []);

  const restartLevel = useCallback(() => {
    dispatch({ type: 'RESTART_LEVEL' });
  }, []);

  const revive = useCallback(() => {
    dispatch({ type: 'REVIVE' });
  }, []);

  return {
    state,
    startLevel,
    toggleCell,
    fillCell,
    endDrag,
    toggleMode,
    useHint,
    clearAutoX,
    restartLevel,
    revive,
  };
}
