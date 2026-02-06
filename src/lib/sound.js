/**
 * Web Audio API 기반 사운드 효과
 * 외부 파일 없이 오실레이터로 생성
 */

const SETTINGS_KEY = 'nonogram_settings';

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // iOS resume
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function isSoundEnabled() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    return s.sound !== false; // default true
  } catch {
    return true;
  }
}

function playTone(frequency, duration, type = 'sine', volume = 0.15, fadeOut = true) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (fadeOut) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // ignore
  }
}

function playNotes(notes, baseDelay = 0) {
  if (!isSoundEnabled()) return;
  try {
    const ctx = getAudioCtx();
    notes.forEach(({ freq, start, dur, type = 'sine', vol = 0.12 }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime + baseDelay + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + baseDelay + start + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + baseDelay + start);
      osc.stop(ctx.currentTime + baseDelay + start + dur);
    });
  } catch {
    // ignore
  }
}

/** 셀 채우기 - 짧은 pop */
export function playFill() {
  playTone(880, 0.08, 'sine', 0.12);
}

/** X 표시 - 짧은 tick */
export function playMark() {
  playTone(300, 0.05, 'square', 0.06);
}

/** 행/열 완료 - 성공 톤 */
export function playLineComplete() {
  playNotes([
    { freq: 523, start: 0, dur: 0.1, vol: 0.1 },
    { freq: 659, start: 0.08, dur: 0.1, vol: 0.1 },
    { freq: 784, start: 0.16, dur: 0.15, vol: 0.12 },
  ]);
}

/** 퍼즐 완료 - 축하 멜로디 */
export function playPuzzleComplete() {
  playNotes([
    { freq: 523, start: 0, dur: 0.15, vol: 0.12 },
    { freq: 659, start: 0.12, dur: 0.15, vol: 0.12 },
    { freq: 784, start: 0.24, dur: 0.15, vol: 0.14 },
    { freq: 1047, start: 0.36, dur: 0.3, vol: 0.16 },
    { freq: 784, start: 0.5, dur: 0.12, vol: 0.1 },
    { freq: 1047, start: 0.62, dur: 0.4, vol: 0.14 },
  ]);
}

/** Undo - 되감기 */
export function playUndo() {
  playNotes([
    { freq: 600, start: 0, dur: 0.06, type: 'triangle', vol: 0.08 },
    { freq: 450, start: 0.05, dur: 0.08, type: 'triangle', vol: 0.06 },
  ]);
}

/** 힌트 사용 - 반짝이는 사운드 */
export function playHint() {
  playNotes([
    { freq: 1200, start: 0, dur: 0.08, type: 'sine', vol: 0.06 },
    { freq: 1600, start: 0.06, dur: 0.08, type: 'sine', vol: 0.08 },
    { freq: 2000, start: 0.12, dur: 0.12, type: 'sine', vol: 0.06 },
  ]);
}

/** 오디오 컨텍스트 초기화 (사용자 제스처 시 호출) */
export function initAudio() {
  try {
    getAudioCtx();
  } catch {
    // ignore
  }
}
