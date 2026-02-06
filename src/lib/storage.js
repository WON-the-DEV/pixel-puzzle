/**
 * localStorage 저장/복원
 */

const STORAGE_KEY = 'nonogram_state';
const GAME_SAVE_KEY = 'nonogram_game_save';
const COLLECTION_KEY = 'nonogram_collection';

const DEFAULT_STATE = {
  currentLevel: 1,
  completedLevels: [],
  bestTimes: {},
  bestStars: {},
  hints: 3, // 글로벌 힌트 잔여
};

export function loadAppState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_STATE, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load app state:', e);
  }
  return { ...DEFAULT_STATE };
}

export function saveAppState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save app state:', e);
  }
}

export function loadGameSave() {
  try {
    const saved = localStorage.getItem(GAME_SAVE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load game save:', e);
  }
  return null;
}

export function saveGameProgress(data) {
  try {
    localStorage.setItem(GAME_SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save game progress:', e);
  }
}

export function clearGameSave() {
  try {
    localStorage.removeItem(GAME_SAVE_KEY);
  } catch {
    // ignore
  }
}

// ─── Collection Progress ───

const DEFAULT_COLLECTION = {
  completedTiles: [], // ["collectionId-tileRow-tileCol", ...]
};

export function loadCollectionProgress() {
  try {
    const saved = localStorage.getItem(COLLECTION_KEY);
    if (saved) {
      return { ...DEFAULT_COLLECTION, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load collection progress:', e);
  }
  return { ...DEFAULT_COLLECTION };
}

export function saveCollectionProgress(state) {
  try {
    localStorage.setItem(COLLECTION_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save collection progress:', e);
  }
}
