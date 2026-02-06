/**
 * SVG Icon Components - 노노그램 커스텀 아이콘 시스템
 * 모든 이모지를 인라인 SVG로 교체
 */

// 앱 로고 - 그리드/픽셀 모양
export function LogoIcon({ size = 28, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="2" y="2" width="12" height="12" rx="2" fill="var(--accent)" />
      <rect x="18" y="2" width="12" height="12" rx="2" fill="var(--accent)" opacity="0.6" />
      <rect x="2" y="18" width="12" height="12" rx="2" fill="var(--accent)" opacity="0.4" />
      <rect x="18" y="18" width="12" height="12" rx="2" fill="var(--accent)" opacity="0.8" />
    </svg>
  );
}

// 연필/브러시 (색칠 모드)
export function PencilIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16.474 5.408l2.118 2.118m-.756-3.982L12.109 9.27a2.118 2.118 0 00-.58 1.082L11 13l2.648-.53a2.118 2.118 0 001.082-.58l5.727-5.727a1.853 1.853 0 10-2.621-2.621z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19 15v3a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// X마크 (X 모드)
export function XMarkIcon({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 전구 (힌트)
export function LightbulbIcon({ size = 24, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 21h6M12 3a6 6 0 00-4 10.472V17a1 1 0 001 1h6a1 1 0 001-1v-3.528A6 6 0 0012 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 17h4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// 되돌리기 화살표 (Undo)
export function UndoIcon({ size = 24, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 10h10a5 5 0 010 10H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 14L3 10l4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 다시실행 화살표 (Redo)
export function RedoIcon({ size = 24, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 10H11a5 5 0 000 10h4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 14l4-4-4-4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 하트 (라이프)
export function HeartIcon({ size = 18, filled = true, color = 'var(--danger)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} className={className}>
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={filled ? 1 : 0.3}/>
    </svg>
  );
}

// 별 (별점)
export function StarIcon({ size = 24, filled = true, color = 'var(--warning)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} className={className}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={filled ? 1 : 0.3}/>
    </svg>
  );
}

// 자물쇠 (잠금)
export function LockIcon({ size = 16, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 체크마크 (완료)
export function CheckIcon({ size = 16, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 뒤로가기 화살표
export function BackIcon({ size = 24, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 톱니바퀴 (설정)
export function SettingsIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 게임패드 (네비게이션 - 퍼즐)
export function PuzzleIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 7h3a2 2 0 012 2v0a2 2 0 002 2h2a2 2 0 002-2v0a2 2 0 012-2h3a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V9a2 2 0 012-2z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8.5" cy="14" r="1.5" fill={color}/>
      <circle cx="15.5" cy="14" r="1.5" fill={color}/>
    </svg>
  );
}

// 컬렉션 아이콘 (그리드)
export function GridIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2"/>
      <rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2"/>
      <rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

// 사운드 아이콘
export function SoundIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M11 5L6 9H2v6h4l5 4V5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 바이브레이션 아이콘
export function VibrationIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="7" y="2" width="10" height="20" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M2 8v8M22 8v8M4.5 6v12M19.5 6v12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// 눈 아이콘 (실수 표시)
export function EyeIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

// 달 아이콘 (다크 모드)
export function MoonIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 책 아이콘 (튜토리얼)
export function BookIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2V3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7V3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 휴지통 아이콘
export function TrashIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 영상 아이콘 (광고)
export function VideoIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="2" y="4" width="15" height="16" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M17 8l5-3v14l-5-3V8z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 다이아몬드 아이콘
export function DiamondIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 3h12l4 7-10 11L2 10l4-7z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2 10h20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// 경고 아이콘
export function AlertIcon({ size = 56, color = 'var(--warning)', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="12" y1="9" x2="12" y2="13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="1" fill={color}/>
    </svg>
  );
}

// 축하/파티 아이콘
export function CelebrationIcon({ size = 56, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="32" cy="32" r="28" fill="var(--accent)" opacity="0.12"/>
      <path d="M32 18v10M27 20l5 8 5-8" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20 32l8 5-8 5M44 32l-8 5 8 5" stroke="var(--warning)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="22" cy="22" r="3" fill="var(--accent)" opacity="0.6"/>
      <circle cx="42" cy="22" r="2.5" fill="var(--warning)" opacity="0.7"/>
      <circle cx="18" cy="40" r="2" fill="var(--success)" opacity="0.6"/>
      <circle cx="46" cy="40" r="2.5" fill="var(--accent)" opacity="0.5"/>
      <path d="M28 40a4 4 0 018 0" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="32" cy="48" r="3" fill="var(--warning)"/>
    </svg>
  );
}

// 깨진 하트 아이콘
export function BrokenHeartIcon({ size = 56, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M32 56L8.5 33.5C2.5 27.5 2.5 17.5 8.5 11.5C14.5 5.5 24.5 5.5 30.5 11.5L32 13L33.5 11.5C39.5 5.5 49.5 5.5 55.5 11.5C61.5 17.5 61.5 27.5 55.5 33.5L32 56Z" fill="var(--danger)" opacity="0.2" stroke="var(--danger)" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M32 18L28 30L36 34L30 50" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 터치 모드 아이콘 (손가락 탭)
export function TouchIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 1a3 3 0 00-3 3v8.5l-1.28-1.28a2 2 0 00-2.83 2.83L10 19.17A4 4 0 0012.83 20.5H16a4 4 0 004-4V10a2 2 0 00-4 0v1a2 2 0 00-4 0V4a3 3 0 00-3-3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// 컨트롤러 모드 아이콘 (게임패드/십자키)
export function ControllerIcon({ size = 22, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
      <circle cx="12" cy="12" r="2" fill={color}/>
      <path d="M12 7l-2-2M12 7l2-2M12 17l-2 2M12 17l2 2M7 12l-2-2M7 12l-2 2M17 12l2-2M17 12l2 2" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// 난이도 도트 배지
export function DifficultyBadge({ color, label, size = 10 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        display: 'inline-block',
        boxShadow: `0 0 0 3px ${color}22`,
      }} />
      <span style={{ color, fontWeight: 700 }}>{label}</span>
    </span>
  );
}

// 튜토리얼 일러스트 아이콘들
export function WelcomeIllust({ size = 80, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="10" y="10" width="24" height="24" rx="4" fill="var(--accent)"/>
      <rect x="38" y="10" width="24" height="24" rx="4" fill="var(--accent)" opacity="0.5"/>
      <rect x="10" y="38" width="24" height="24" rx="4" fill="var(--accent)" opacity="0.3"/>
      <rect x="38" y="38" width="24" height="24" rx="4" fill="var(--accent)" opacity="0.7"/>
      <rect x="66" y="10" width="8" height="8" rx="2" fill="var(--warning)" opacity="0.6"/>
      <rect x="66" y="22" width="8" height="8" rx="2" fill="var(--warning)" opacity="0.4"/>
      <circle cx="70" cy="46" r="4" fill="var(--success)" opacity="0.5"/>
      <circle cx="70" cy="58" r="3" fill="var(--success)" opacity="0.3"/>
    </svg>
  );
}

export function NumbersIllust({ size = 80, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="8" y="8" width="64" height="64" rx="12" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="2"/>
      <text x="24" y="34" fontFamily="system-ui" fontWeight="800" fontSize="18" fill="var(--accent)">1</text>
      <text x="44" y="34" fontFamily="system-ui" fontWeight="800" fontSize="18" fill="var(--accent)">3</text>
      <text x="18" y="54" fontFamily="system-ui" fontWeight="800" fontSize="14" fill="var(--text-secondary)">2</text>
      <rect x="32" y="42" width="16" height="16" rx="3" fill="var(--cell-filled)"/>
      <rect x="52" y="42" width="16" height="16" rx="3" fill="var(--cell-filled)" opacity="0.4"/>
    </svg>
  );
}

export function TapIllust({ size = 80, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      <rect x="16" y="16" width="48" height="48" rx="10" fill="var(--bg-secondary)" stroke="var(--border)" strokeWidth="2"/>
      <rect x="24" y="24" width="14" height="14" rx="3" fill="var(--cell-filled)"/>
      <rect x="42" y="24" width="14" height="14" rx="3" fill="var(--cell-filled)" opacity="0.3"/>
      <rect x="24" y="42" width="14" height="14" rx="3" fill="var(--cell-filled)" opacity="0.3"/>
      <rect x="42" y="42" width="14" height="14" rx="3" fill="var(--accent)" opacity="0.6"/>
      <circle cx="49" cy="49" r="10" fill="var(--accent)" opacity="0.2"/>
      <circle cx="49" cy="49" r="5" fill="var(--accent)" opacity="0.4"/>
    </svg>
  );
}

export function ToolsIllust({ size = 80, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
      <circle cx="28" cy="28" r="18" fill="var(--accent)" opacity="0.1"/>
      <circle cx="52" cy="52" r="14" fill="var(--warning)" opacity="0.1"/>
      <path d="M24 20v16M32 20v16" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round"/>
      <path d="M22 28h12" stroke="var(--danger)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="52" cy="38" r="6" stroke="var(--warning)" strokeWidth="2.5" fill="none"/>
      <path d="M52 34v3M52 41v1.5" stroke="var(--warning)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M48 38h3M55 38h1.5" stroke="var(--warning)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
