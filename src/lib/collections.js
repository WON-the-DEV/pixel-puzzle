/**
 * 컬렉션 데이터 - 큰 그림 (Luna Story BIG 모드 스타일)
 * 
 * 각 컬렉션은:
 * - 하나의 큰 pixel art 그림
 * - N×M 타일로 나뉨 (각 타일이 하나의 노노그램 퍼즐)
 * - 색상 팔레트 포함
 * 
 * bigPicture: 2D 배열 [rows][cols], 값 = 색상 인덱스 (0=빈칸, 1+ = palette 인덱스)
 * tileRows, tileCols: 타일 그리드 크기
 * tileSize: 각 타일의 퍼즐 크기 (5=5x5, 10=10x10)
 * palette: 색상 배열 (인덱스 1부터 시작)
 */

// ─── 컬렉션 1: 고양이 (4×4 타일, 각 5×5 = 총 20×20) ───
const CAT_PALETTE = ['#FF6B6B', '#4ECDC4', '#2C3E50', '#F39C12', '#FFFFFF'];

// 20×20 고양이 pixel art
const CAT_PICTURE = [
  // Row 0-4 (Tile row 0)
  [0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0,0,0],
  [0,0,3,3,3,3,0,0,0,0,0,0,0,3,3,3,3,0,0,0],
  [0,3,3,3,3,3,3,0,0,0,0,0,3,3,3,3,3,3,0,0],
  [3,3,3,3,3,3,3,3,0,0,0,3,3,3,3,3,3,3,3,0],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0],

  // Row 5-9 (Tile row 1)
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0],
  [3,3,5,5,3,3,3,3,3,3,3,3,3,3,5,5,3,3,3,0],
  [3,3,5,2,3,3,3,3,3,3,3,3,3,3,2,5,3,3,3,0],
  [3,3,3,3,3,3,3,1,1,3,3,1,1,3,3,3,3,3,3,0],
  [3,3,3,3,3,3,3,3,1,1,1,1,3,3,3,3,3,3,3,0],

  // Row 10-14 (Tile row 2)
  [3,3,3,3,3,3,3,3,3,1,3,3,3,3,3,3,3,3,3,0],
  [3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0],
  [0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0],
  [0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0],
  [0,0,3,3,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0],

  // Row 15-19 (Tile row 3)
  [0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,3,4,4,3,3,3,4,4,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,0,0,0,4,4,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];

// ─── 컬렉션 2: 꽃 (3×3 타일, 각 10×10 = 총 30×30) ───
const FLOWER_PALETTE = ['#FF6B6B', '#FF8E8E', '#4ECDC4', '#2ECC71', '#F39C12'];

// Bug 7: Balanced flower — outlines with some fill, 25-55% per tile
function generateFlowerPicture() {
  const size = 30;
  const pic = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // Helper: draw filled circle
  function fillCircle(cx, cy, r, color) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (y < 0 || y >= size || x < 0 || x >= size) continue;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r * r) {
          pic[y][x] = color;
        }
      }
    }
  }
  
  // Helper: clear inner circle (make ring)
  function clearCircle(cx, cy, r) {
    for (let y = cy - r; y <= cy + r; y++) {
      for (let x = cx - r; x <= cx + r; x++) {
        if (y < 0 || y >= size || x < 0 || x >= size) continue;
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r * r) {
          pic[y][x] = 0;
        }
      }
    }
  }
  
  // 꽃잎 - thin rings (larger hollow center)
  fillCircle(15, 6, 5, 1);   clearCircle(15, 6, 3);    // 상단 꽃잎 ring
  fillCircle(8, 13, 5, 2);   clearCircle(8, 13, 3);     // 좌측 꽃잎 ring
  fillCircle(22, 13, 5, 1);  clearCircle(22, 13, 3);    // 우측 꽃잎 ring
  fillCircle(10, 20, 4, 2);  clearCircle(10, 20, 2);    // 하단 좌 꽃잎 ring
  fillCircle(20, 20, 4, 1);  clearCircle(20, 20, 2);    // 하단 우 꽃잎 ring

  // 중심 (thin ring only)
  fillCircle(15, 14, 3, 5);
  clearCircle(15, 14, 2);
  // Just a center dot
  pic[14][15] = 5;

  // 줄기 (double width)
  for (let y = 18; y < 28; y++) {
    pic[y][14] = 4;
    pic[y][15] = 4;
  }
  
  // 잎 좌 (wider leaf shape)
  for (let i = 0; i < 5; i++) {
    const baseY = 21 + i;
    if (baseY < size) {
      if (13 - i >= 0) pic[baseY][13 - i] = 4;
      if (12 - i >= 0) pic[baseY][12 - i] = 4;
      if (11 - i >= 0 && i < 4) pic[baseY][11 - i] = 4;
    }
  }
  // 잎 우 (wider leaf shape)
  for (let i = 0; i < 5; i++) {
    const baseY = 19 + i;
    if (baseY < size) {
      if (16 + i < size) pic[baseY][16 + i] = 4;
      if (17 + i < size) pic[baseY][17 + i] = 4;
      if (18 + i < size && i < 4) pic[baseY][18 + i] = 4;
    }
  }
  
  // Corner decorations — small dots/shapes to give edge tiles content
  // Top-left: small leaf bud
  const buds = [
    [2, 3], [2, 4], [3, 3], [3, 4], [4, 2],
    [1, 5], [3, 6], [5, 2], [6, 3],
  ];
  for (const [by, bx] of buds) {
    if (pic[by][bx] === 0) pic[by][bx] = 4;
  }
  // Top-right: small decoration
  const topRight = [
    [1, 27], [2, 26], [2, 27], [3, 25], [3, 26],
    [4, 27], [5, 28], [6, 27],
  ];
  for (const [by, bx] of topRight) {
    if (bx < size && pic[by][bx] === 0) pic[by][bx] = 2;
  }
  // Bottom-left
  const botLeft = [
    [27, 2], [27, 3], [28, 3], [28, 4], [26, 1],
    [29, 2], [29, 3], [26, 4], [25, 2],
  ];
  for (const [by, bx] of botLeft) {
    if (by < size && pic[by][bx] === 0) pic[by][bx] = 4;
  }
  // Bottom-right
  const botRight = [
    [27, 27], [27, 26], [28, 26], [28, 27], [29, 28],
    [26, 28], [25, 27], [29, 26],
  ];
  for (const [by, bx] of botRight) {
    if (by < size && bx < size && pic[by][bx] === 0) pic[by][bx] = 1;
  }

  return pic;
}

// ─── 컬렉션 3: 로켓 (3×3 타일, 각 10×10 = 총 30×30) ───
const ROCKET_PALETTE = ['#E74C3C', '#3498DB', '#ECF0F1', '#F39C12', '#2C3E50'];

// Bug 7: Balanced rocket — outlines + partial fills, 20-55% per tile
function generateRocketPicture() {
  const size = 30;
  const pic = Array(size).fill(null).map(() => Array(size).fill(0));

  // 로켓 본체 — outline with some internal detail (not fully solid)
  for (let y = 4; y < 22; y++) {
    const halfWidth = y < 8 ? (y - 4) + 1 : y < 18 ? 5 : 5 - (y - 18);
    const left = 15 - halfWidth;
    const right = 15 + halfWidth;
    // Left and right walls
    if (left >= 0 && left < size) pic[y][left] = 3;
    if (left + 1 >= 0 && left + 1 < size && halfWidth > 2) pic[y][left + 1] = 3;
    if (right >= 0 && right < size) pic[y][right] = 3;
    if (right - 1 >= 0 && right - 1 < size && halfWidth > 2) pic[y][right - 1] = 3;
    // Top edge (cone)
    if (y < 8) {
      for (let x = left; x <= right; x++) {
        if (x >= 0 && x < size) pic[y][x] = 3;
      }
    }
    // Bottom edge
    if (y === 21) {
      for (let x = left; x <= right; x++) {
        if (x >= 0 && x < size) pic[y][x] = 3;
      }
    }
  }
  
  // 코 (빨강) — solid cone tip
  for (let y = 2; y < 6; y++) {
    const hw = Math.max(0, y - 3);
    for (let x = 15 - hw; x <= 15 + hw; x++) {
      pic[y][x] = 1;
    }
  }

  // 창문 (파랑) — solid small circle
  for (let y = 9; y <= 12; y++) {
    for (let x = 13; x <= 17; x++) {
      const dx = x - 15;
      const dy = y - 10.5;
      if (dx * dx + dy * dy <= 4) {
        pic[y][x] = 2;
      }
    }
  }

  // 날개 좌 (빨강) — outline triangle
  for (let y = 16; y < 22; y++) {
    const w = Math.min(y - 16 + 1, 3);
    const left = 10 - w;
    // Left edge and right edge of wing
    if (left >= 0) pic[y][left] = 1;
    pic[y][10] = 1;
    // Top and bottom fill
    if (y === 16 || y === 21 || y === 17) {
      for (let x = left; x <= 10; x++) {
        if (x >= 0) pic[y][x] = 1;
      }
    }
  }

  // 날개 우 (빨강) — outline triangle
  for (let y = 16; y < 22; y++) {
    const w = Math.min(y - 16 + 1, 3);
    const right = 20 + w;
    pic[y][20] = 1;
    if (right < size) pic[y][right] = 1;
    if (y === 16 || y === 21 || y === 17) {
      for (let x = 20; x <= right; x++) {
        if (x < size) pic[y][x] = 1;
      }
    }
  }

  // 화염 (노랑/주황) — alternating pattern for interest
  for (let y = 22; y < 28; y++) {
    const intensity = 28 - y;
    const hw = Math.min(intensity, 3);
    for (let x = 15 - hw; x <= 15 + hw; x++) {
      if (x >= 0 && x < size) {
        // Checkerboard pattern for interesting puzzle
        if ((x + y) % 2 === 0) {
          pic[y][x] = 4;
        } else {
          pic[y][x] = 1;
        }
      }
    }
  }

  // 별 배경 + 행성/성운 — all tiles get meaningful content
  // Scattered stars (single dots)
  const stars = [
    [2, 3], [5, 25], [1, 20], [8, 2], [3, 27], 
    [25, 3], [27, 26], [10, 27], [22, 1],
    [0, 8], [7, 28], [28, 8], [15, 0], [15, 29],
    [4, 26], [26, 4], [0, 0], [29, 29], [6, 0],
    [24, 28], [1, 1], [28, 1], [1, 28],
  ];
  for (const [sy, sx] of stars) {
    if (sy < size && sx < size && pic[sy][sx] === 0) pic[sy][sx] = 5;
  }
  
  // Small planet top-left (gives tile [0,0] more content)
  const planetTL = [[3, 4], [3, 5], [4, 3], [4, 4], [4, 5], [4, 6], [5, 4], [5, 5], [6, 3], [6, 4], [6, 5], [7, 4], [7, 5], [8, 4]];
  for (const [py, px] of planetTL) {
    if (pic[py][px] === 0) pic[py][px] = 2;
  }
  
  // Space station mid-left (gives tile [1,0] more content)
  const stationML = [
    [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7],
    [11, 3], [11, 5], [11, 7],
    [12, 2], [12, 3], [12, 4], [12, 5], [12, 6], [12, 7],
    [13, 3], [13, 5],
    [14, 1], [14, 2], [14, 3], [14, 4], [14, 5], [14, 6], [14, 7], [14, 8],
    [15, 3], [15, 5],
    [16, 2], [16, 3], [16, 4], [16, 5], [16, 6], [16, 7],
    [17, 4], [17, 5], [18, 3], [18, 4], [18, 5], [18, 6],
  ];
  for (const [sy, sx] of stationML) {
    if (sy < size && sx < size && pic[sy][sx] === 0) pic[sy][sx] = 3;
  }
  
  // Small nebula top-right (gives tile [0,2] content)
  const nebulaTR = [[2, 24], [2, 25], [3, 23], [3, 24], [3, 25], [3, 26], [4, 24], [4, 25], [5, 23], [5, 26], [6, 24], [6, 25]];
  for (const [ny, nx] of nebulaTR) {
    if (nx < size && pic[ny][nx] === 0) pic[ny][nx] = 4;
  }
  
  // Asteroid cluster bottom-left (gives tile [2,0] content)
  const asteroidBL = [[22, 3], [22, 4], [23, 2], [23, 3], [23, 4], [24, 3], [24, 4], [24, 5], [25, 4], [25, 5], [26, 3], [26, 4], [27, 4], [27, 5]];
  for (const [ay, ax] of asteroidBL) {
    if (ay < size && pic[ay][ax] === 0) pic[ay][ax] = 3;
  }
  
  // Moon bottom-right (gives tile [2,2] content)
  const moonBR = [[23, 25], [23, 26], [24, 24], [24, 25], [24, 26], [24, 27], [25, 25], [25, 26], [25, 27], [26, 24], [26, 25], [26, 26], [27, 25], [27, 26]];
  for (const [my, mx] of moonBR) {
    if (my < size && mx < size && pic[my][mx] === 0) pic[my][mx] = 3;
  }

  return pic;
}

// ─── 컬렉션 4: 하트 (3×3 타일, 각 5×5 = 총 15×15) ───
const HEART_PALETTE = ['#FF6B6B', '#FF8E8E', '#C0392B'];

const HEART_PICTURE = (() => {
  const size = 15;
  const pic = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // 하트 모양
  const heartShape = [
    [0,0,1,1,1,0,0,0,0,1,1,1,0,0,0],
    [0,1,1,2,1,1,0,0,1,1,2,1,1,0,0],
    [1,1,2,2,1,1,1,1,1,1,2,1,1,1,0],
    [1,1,2,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
    [0,0,0,0,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,3,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ];
  
  return heartShape;
})();


// ─── 컬렉션 5: 크리스마스 트리 (3×3 타일, 각 5×5 = 총 15×15) ───
const TREE_PALETTE = ['#2ECC71', '#E74C3C', '#F1C40F', '#8B6914', '#27AE60'];

// 15×15 크리스마스 트리 pixel art
const TREE_PICTURE = [
  // Row 0-4 (Tile row 0) — 별 + 트리 꼭대기
  [0,0,0,0,0,0,0,3,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,3,3,3,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  [0,0,0,0,0,1,5,1,5,1,0,0,0,0,0],
  // Row 5-9 (Tile row 1) — 트리 중간
  [0,0,0,0,1,1,1,2,1,1,1,0,0,0,0],
  [0,0,0,0,0,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,1,2,1,1,1,1,0,0,0,0],
  [0,0,0,1,1,1,1,1,2,1,1,1,0,0,0],
  [0,0,1,1,1,3,1,1,1,3,1,1,1,0,0],
  // Row 10-14 (Tile row 2) — 트리 하단 + 줄기
  [0,1,1,2,1,1,1,1,1,1,1,2,1,1,0],
  [1,1,1,1,1,3,1,1,1,3,1,1,1,1,1],
  [0,0,0,0,0,0,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,0,4,4,4,0,0,0,0,0,0],
  [0,0,0,0,0,4,4,4,4,4,0,0,0,0,0],
];

// ─── 컬렉션 6: 바다거북 (4×3 타일, 각 5×5 = 총 20×15) ───
const TURTLE_PALETTE = ['#2ECC71', '#3498DB', '#F5DEB3', '#1ABC9C', '#2C3E50'];

// 15×20 바다거북 pixel art (rows=15, cols=20, tileRows=3, tileCols=4)
const TURTLE_PICTURE = [
  // Row 0-4 (Tile row 0) — 머리 + 등껍질 상단
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,1,1,1,1,0,0,0,0,4,4,4,4,4,4,0,0,0,0],
  [0,0,1,5,1,1,0,0,0,4,1,1,1,1,1,1,4,0,0,0],
  [0,0,0,1,1,0,0,0,4,1,1,4,4,1,1,4,1,4,0,0],
  // Row 5-9 (Tile row 1) — 등껍질 + 지느러미
  [0,0,0,0,3,3,0,4,1,1,4,1,1,4,1,1,4,1,4,0],
  [3,3,0,0,0,3,4,1,1,1,1,4,4,1,1,1,1,1,4,0],
  [0,3,3,0,0,0,4,1,1,4,1,1,1,4,1,1,4,4,0,0],
  [0,0,3,3,0,0,4,1,1,1,4,4,4,1,1,1,4,0,0,0],
  [0,0,0,0,0,0,0,4,1,1,1,1,1,1,1,4,0,0,0,0],
  // Row 10-14 (Tile row 2) — 하체 + 뒷지느러미 + 꼬리
  [0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,0,3,3,0,0,0,0,0,0,0,0,0,3,3,0,0],
  [0,0,0,0,0,0,3,3,0,0,0,0,0,0,0,3,3,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
];

// ─── 컬렉션 7: 음식 (3×4 타일, 각 5×5 = 총 15×20) ───
const FOOD_PALETTE = ['#E74C3C', '#F1C40F', '#F39C12', '#2ECC71', '#8B4513'];

// 20×15 음식 (피자 조각) pixel art (rows=20, cols=15, tileRows=4, tileCols=3)
const FOOD_PICTURE = [
  // Row 0-4 (Tile row 0) — 피자 상단 크러스트
  [0,0,0,0,5,5,5,5,5,5,5,0,0,0,0],
  [0,0,0,5,3,3,3,3,3,3,3,5,0,0,0],
  [0,0,5,3,2,3,3,3,3,2,3,3,5,0,0],
  [0,5,3,3,3,3,3,3,3,3,3,3,3,5,0],
  [5,3,3,3,3,1,1,3,3,3,3,3,3,3,5],
  // Row 5-9 (Tile row 1) — 피자 치즈 + 토핑
  [5,2,3,3,3,1,1,3,3,3,4,4,3,3,5],
  [0,5,3,4,4,3,3,3,3,3,4,4,3,5,0],
  [0,5,3,4,4,3,3,2,3,3,3,3,3,5,0],
  [0,0,5,3,3,3,3,3,3,3,1,1,5,0,0],
  [0,0,0,5,3,3,3,3,3,3,1,5,0,0,0],
  // Row 10-14 (Tile row 2) — 피자 하단 좁아짐
  [0,0,0,0,5,3,3,1,3,3,5,0,0,0,0],
  [0,0,0,0,0,5,3,1,3,5,0,0,0,0,0],
  [0,0,0,0,0,0,5,3,5,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,5,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  // Row 15-19 (Tile row 3) — 하단 빈 공간 (사이드 음식 아이콘들)
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,1,1,1,0,0,0,0,0,0,0,2,2,0,0],
  [0,1,2,1,0,0,4,4,0,0,0,2,3,2,0],
  [0,1,1,1,0,0,4,4,4,0,0,2,2,0,0],
  [0,0,1,0,0,0,0,4,0,0,0,0,0,0,0],
];

export const COLLECTION_DATA = [
  {
    id: 'heart',
    name: '사랑의 하트',
    emoji: '❤️',
    description: '9개의 퍼즐을 풀어 하트를 완성하세요',
    palette: HEART_PALETTE,
    bigPicture: HEART_PICTURE,
    tileRows: 3,
    tileCols: 3,
    tileSize: 5,
    difficulty: '입문',
    color: '#FF6B6B',
  },
  {
    id: 'cat',
    name: '귀여운 고양이',
    emoji: '🐱',
    description: '16개의 퍼즐을 풀어 고양이를 완성하세요',
    palette: CAT_PALETTE,
    bigPicture: CAT_PICTURE,
    tileRows: 4,
    tileCols: 4,
    tileSize: 5,
    difficulty: '초급',
    color: '#F39C12',
  },
  {
    id: 'flower',
    name: '아름다운 꽃',
    emoji: '🌸',
    description: '9개의 퍼즐을 풀어 꽃을 완성하세요',
    palette: FLOWER_PALETTE,
    bigPicture: generateFlowerPicture(),
    tileRows: 3,
    tileCols: 3,
    tileSize: 10,
    difficulty: '중급',
    color: '#FF6B6B',
  },
  {
    id: 'rocket',
    name: '우주 로켓',
    emoji: '🚀',
    description: '9개의 퍼즐을 풀어 로켓을 완성하세요',
    palette: ROCKET_PALETTE,
    bigPicture: generateRocketPicture(),
    tileRows: 3,
    tileCols: 3,
    tileSize: 10,
    difficulty: '고급',
    color: '#3498DB',
  },
  {
    id: 'tree',
    name: '크리스마스 트리',
    emoji: '🎄',
    description: '9개의 퍼즐을 풀어 트리를 완성하세요',
    palette: TREE_PALETTE,
    bigPicture: TREE_PICTURE,
    tileRows: 3,
    tileCols: 3,
    tileSize: 5,
    difficulty: '입문',
    color: '#2ECC71',
  },
  {
    id: 'turtle',
    name: '바다거북',
    emoji: '🐢',
    description: '12개의 퍼즐을 풀어 거북이를 완성하세요',
    palette: TURTLE_PALETTE,
    bigPicture: TURTLE_PICTURE,
    tileRows: 3,
    tileCols: 4,
    tileSize: 5,
    difficulty: '초급',
    color: '#1ABC9C',
  },
  {
    id: 'food',
    name: '맛있는 음식',
    emoji: '🍕',
    description: '12개의 퍼즐을 풀어 음식을 완성하세요',
    palette: FOOD_PALETTE,
    bigPicture: FOOD_PICTURE,
    tileRows: 4,
    tileCols: 3,
    tileSize: 5,
    difficulty: '초급',
    color: '#F39C12',
  },
];

/**
 * 컬렉션에서 특정 타일의 퍼즐 데이터 추출
 * @param {object} collection - 컬렉션 데이터
 * @param {number} tileRow - 타일 행
 * @param {number} tileCol - 타일 열
 * @returns {{ solution: number[][], palette: string[] }}
 */
export function extractTilePuzzle(collection, tileRow, tileCol) {
  const { bigPicture, tileSize } = collection;
  const startRow = tileRow * tileSize;
  const startCol = tileCol * tileSize;
  
  const solution = [];
  for (let r = 0; r < tileSize; r++) {
    const row = [];
    for (let c = 0; c < tileSize; c++) {
      const pr = startRow + r;
      const pc = startCol + c;
      if (pr < bigPicture.length && pc < bigPicture[0].length) {
        row.push(bigPicture[pr][pc]);
      } else {
        row.push(0);
      }
    }
    solution.push(row);
  }
  
  return { solution, palette: collection.palette };
}

/**
 * 멀티컬러 단서 생성
 * solution 값이 0=빈칸, 1+=색상인덱스
 * 반환: 각 행/열에 대해 [{count, colorIndex}]
 */
export function generateMultiColorClues(grid) {
  return grid.map((row) => {
    const clues = [];
    let count = 0;
    let currentColor = 0;
    
    for (const cell of row) {
      if (cell > 0) {
        if (cell === currentColor) {
          count++;
        } else {
          if (count > 0) {
            clues.push({ count, colorIndex: currentColor });
          }
          currentColor = cell;
          count = 1;
        }
      } else {
        if (count > 0) {
          clues.push({ count, colorIndex: currentColor });
          count = 0;
          currentColor = 0;
        }
      }
    }
    if (count > 0) {
      clues.push({ count, colorIndex: currentColor });
    }
    
    return clues.length > 0 ? clues : [{ count: 0, colorIndex: 0 }];
  });
}

/**
 * 멀티컬러 그리드 전치
 */
export function transposeGrid(grid) {
  if (!grid.length) return [];
  return grid[0].map((_, colIndex) => grid.map((row) => row[colIndex]));
}

/**
 * 단색 단서 생성 (색상 무관 — >0이면 채워야 할 셀)
 */
export function generateMonoClues(grid) {
  return grid.map((row) => {
    const clues = [];
    let count = 0;
    for (const cell of row) {
      if (cell > 0) {
        count++;
      } else {
        if (count > 0) {
          clues.push(count);
          count = 0;
        }
      }
    }
    if (count > 0) clues.push(count);
    return clues.length > 0 ? clues : [0];
  });
}

/**
 * 컬렉션 타일의 전체 퍼즐 데이터 생성 (단색 모드)
 * 플레이는 단색(채우기/X)으로, 완료 후 큰 그림에서만 컬러 표시
 */
export function createCollectionPuzzle(collection, tileRow, tileCol) {
  const { solution, palette } = extractTilePuzzle(collection, tileRow, tileCol);
  const size = solution.length;
  
  // 단색 단서 (색상 구분 없이 >0이면 채워야 할 셀)
  const rowClues = generateMonoClues(solution);
  const colClues = generateMonoClues(transposeGrid(solution));
  
  // 채워야 할 셀 수
  const totalFilled = solution.flat().filter(c => c > 0).length;
  
  return {
    size,
    solution,
    rowClues,
    colClues,
    palette,
    totalFilled,
    isMultiColor: false, // 항상 단색 플레이
    name: `${collection.name} ${tileRow * collection.tileCols + tileCol + 1}`,
  };
}

/**
 * 솔루션 체크 (단색 모드: expected > 0이면 actual === 1이어야 정답)
 */
export function checkMonoSolution(solution, playerGrid) {
  const size = solution.length;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const expected = solution[i][j];
      const actual = playerGrid[i][j];
      if (expected > 0 && actual !== 1) return false;
      if (expected === 0 && actual === 1) return false;
    }
  }
  return true;
}
