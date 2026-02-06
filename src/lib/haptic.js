/**
 * 햅틱(진동) 피드백 유틸
 * navigator.vibrate() 지원 기기에서만 동작
 */

const SETTINGS_KEY = 'nonogram_settings';

function isHapticEnabled() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return s.haptic !== false; // default true
  } catch {
    return true;
  }
}

function vibrate(pattern) {
  if (!isHapticEnabled()) return;
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore
    }
  }
}

/** 셀 채우기 - 짧은 진동 10ms */
export function hapticFill() {
  vibrate(10);
}

/** 행/열 완료 - 20ms */
export function hapticLineComplete() {
  vibrate(20);
}

/** 퍼즐 완료 - 패턴 진동 */
export function hapticPuzzleComplete() {
  vibrate([30, 50, 30]);
}

/** 일반 탭 - 가장 짧은 진동 */
export function hapticTap() {
  vibrate(5);
}

/** 라이프 감소 - 강한 진동 */
export function hapticLifeLost() {
  vibrate([40, 30, 40]);
}

/** 게임 오버 - 긴 진동 */
export function hapticGameOver() {
  vibrate([50, 40, 50, 40, 80]);
}

/** 자동 X - 약한 진동 */
export function hapticAutoX() {
  vibrate(8);
}
