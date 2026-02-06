import { useReducer, useCallback, useRef, useEffect } from 'react';
import {
  createPuzzleForLevel,
  checkSolution,
  getHint,
  getSizeForLevel,
} from '../lib/puzzle.js';

// 0 = empty, 1 = filled, 2 = X mark
const INITIAL_STATE = {
  level: 1,
  puzzle: null, // { size, solution, rowClues, colClues, name }
  playerGrid: [],
  mode: 'fill', // 'fill' | 'mark'
  history: [],
  historyIndex: -1,
  hints: 3,
  startTime: null,
  elapsedTime: 0,
  isComplete: false,
};

function cloneGrid(grid) {
  return grid.map((row) => [...row]);
}

function createEmptyGrid(size) {
  return Array(size)
    .fill(null)
    .map(() => Array(size).fill(0));
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
        hints: 3,
        startTime: Date.now(),
        elapsedTime: 0,
        isComplete: false,
      };
    }

    case 'TOGGLE_CELL': {
      if (state.isComplete) return state;
      const { row, col } = action;
      const newGrid = cloneGrid(state.playerGrid);
      const current = newGrid[row][col];

      if (state.mode === 'fill') {
        newGrid[row][col] = current === 1 ? 0 : 1;
      } else {
        newGrid[row][col] = current === 2 ? 0 : 2;
      }

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(newGrid));
      if (newHistory.length > 100) newHistory.shift();

      const isComplete = checkSolution(state.puzzle.solution, newGrid);

      return {
        ...state,
        playerGrid: newGrid,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
      };
    }

    case 'FILL_CELL': {
      if (state.isComplete) return state;
      const { row, col, value } = action;
      if (state.playerGrid[row][col] === value) return state;
      const newGrid = cloneGrid(state.playerGrid);
      newGrid[row][col] = value;
      return { ...state, playerGrid: newGrid };
    }

    case 'END_DRAG': {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(state.playerGrid));
      if (newHistory.length > 100) newHistory.shift();

      const isComplete = checkSolution(state.puzzle.solution, state.playerGrid);

      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
      };
    }

    case 'TOGGLE_MODE':
      return { ...state, mode: state.mode === 'fill' ? 'mark' : 'fill' };

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const newIndex = state.historyIndex - 1;
      return {
        ...state,
        playerGrid: cloneGrid(state.history[newIndex]),
        historyIndex: newIndex,
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const newIndex = state.historyIndex + 1;
      return {
        ...state,
        playerGrid: cloneGrid(state.history[newIndex]),
        historyIndex: newIndex,
      };
    }

    case 'USE_HINT': {
      if (state.hints <= 0 || state.isComplete) return state;
      const hint = getHint(state.puzzle.solution, state.playerGrid);
      if (!hint) return state;

      const newGrid = cloneGrid(state.playerGrid);
      newGrid[hint.row][hint.col] = hint.value === 1 ? 1 : 2;

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(cloneGrid(newGrid));
      if (newHistory.length > 100) newHistory.shift();

      const isComplete = checkSolution(state.puzzle.solution, newGrid);

      return {
        ...state,
        playerGrid: newGrid,
        hints: state.hints - 1,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        isComplete,
        elapsedTime: isComplete ? Date.now() - state.startTime : state.elapsedTime,
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
  };
}
