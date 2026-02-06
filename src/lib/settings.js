/**
 * 설정 관리 유틸
 */

const SETTINGS_KEY = 'nonogram_settings';

const DEFAULT_SETTINGS = {
  sound: true,
  haptic: true,
  darkMode: false,
  // showMistakes removed — always on as default behavior
};

export function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export function getSetting(key) {
  const settings = loadSettings();
  return settings[key] ?? DEFAULT_SETTINGS[key];
}

export function setSetting(key, value) {
  const settings = loadSettings();
  settings[key] = value;
  saveSettings(settings);
  return settings;
}
