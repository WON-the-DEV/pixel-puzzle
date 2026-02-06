import { useReducer, useCallback } from 'react';
import {
  createPuzzleForLevel,
  checkSolution,
  getHint,
  autoFillCompletedLines,
  getFilledCorrectCount,
} from '../lib/puzzle.js';

// 0 = empty, 1 = filled, 2 = X mark
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
      const playerGrid = createEmptyGrid(puzzle.size);
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

      if (state.mode === 'fill') {
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
            // 잘못 채운 셀은 X로 표시 (자동 교정)
            newGrid[row][col] = 2;
          }
        }
      } else {
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
      };
    }

    case 'FILL_CELL': {
      if (state.isComplete || state.isGameOver) return state;
      const { row, col, value } = action;
      if (state.playerGrid[row][col] === value) return state;

      const newGrid = cloneGrid(state.playerGrid);

      // 드래그 중 fill 모드에서 잘못된 셀 체크
      if (value === 1) {
        const expected = state.puzzle.solution[row][col];
        if (expected !== 1) {
          // 드래그 중에는 라이프 감소 + X 표시
          const newLives = Math.max(0, state.lives - 1);
          newGrid[row][col] = 2;
          if (newLives === 0) {
            return {
              ...state,
              playerGrid: newGrid,
              lives: newLives,
              isGameOver: true,
              lostLife: true,
            };
          }
          return {
            ...state,
            playerGrid: newGrid,
            lives: newLives,
            lostLife: true,
          };
        }
      }

      newGrid[row][col] = value;
      return { ...state, playerGrid: newGrid };
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
      };
    }

    case 'CLEAR_AUTO_X':
      return { ...state, autoXCells: [], lostLife: false };

    case 'RESTART_LEVEL': {
      const puzzle = state.puzzle;
      if (!puzzle) return state;
      const playerGrid = createEmptyGrid(puzzle.size);
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
      };
    }

    default:
      return state;
  }
}

export function useGame() {
  const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);

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

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
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

  return {
    state,
    startLevel,
    toggleCell,
    fillCell,
    endDrag,
    toggleMode,
    undo,
    redo,
    useHint,
    clearAutoX,
    restartLevel,
  };
}
