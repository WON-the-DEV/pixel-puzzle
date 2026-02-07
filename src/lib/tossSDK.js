// Granite SDK interface placeholder
// 앱인토스 실제 연동 시 이 파일만 교체하면 됩니다.

const AD_LIMIT_KEY = 'nonogram_ad_watch_state';
const MAX_DAILY_ADS = 5;

function getAdState() {
  try {
    const raw = localStorage.getItem(AD_LIMIT_KEY);
    if (!raw) return { date: '', count: 0 };
    return JSON.parse(raw);
  } catch {
    return { date: '', count: 0 };
  }
}

function saveAdState(state) {
  try {
    localStorage.setItem(AD_LIMIT_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function getTodayAdCount() {
  const state = getAdState();
  const today = new Date().toISOString().slice(0, 10);
  if (state.date !== today) return 0;
  return state.count;
}

export function getRemainingAds() {
  return MAX_DAILY_ADS - getTodayAdCount();
}

export function incrementAdCount() {
  const today = new Date().toISOString().slice(0, 10);
  const state = getAdState();
  if (state.date !== today) {
    saveAdState({ date: today, count: 1 });
  } else {
    saveAdState({ date: today, count: state.count + 1 });
  }
}

export function canWatchAd() {
  return getRemainingAds() > 0;
}

export const TossSDK = {
  isInToss: () => typeof window !== 'undefined' && !!window.__GRANITE__,

  // 광고 표시
  showRewardedAd: async () => {
    if (!canWatchAd()) {
      console.log('[TossSDK] Daily ad limit reached');
      return { rewarded: false, reason: 'daily_limit' };
    }
    console.log('[TossSDK] showRewardedAd called');
    incrementAdCount();
    return { rewarded: true };
  },

  // 인앱 구매
  purchase: async (productId) => {
    console.log('[TossSDK] purchase called:', productId);
    return { success: true, productId };
  },

  // 유저 정보
  getUserInfo: async () => null,

  // 공유
  share: async (data) => {
    if (navigator.share) return navigator.share(data);
  },

  // 상수
  MAX_DAILY_ADS,
};
