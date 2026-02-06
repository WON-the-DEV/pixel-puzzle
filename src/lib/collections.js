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

// 30×30 꽃 pixel art (간결하게 표현)
function generateFlowerPicture() {
  const size = 30;
  const pic = Array(size).fill(null).map(() => Array(size).fill(0));
  
  // 꽃잎 - 상단 (빨강/핑크)
  const petalPositions = [
    // 상단 꽃잎
    {cx: 15, cy: 6, r: 5, color: 1},
    // 좌측 꽃잎
    {cx: 8, cy: 13, r: 5, color: 2},
    // 우측 꽃잎
    {cx: 22, cy: 13, r: 5, color: 1},
    // 하단 좌 꽃잎
    {cx: 10, cy: 20, r: 4, color: 2},
    // 하단 우 꽃잎
    {cx: 20, cy: 20, r: 4, color: 1},
  ];
  
  for (const p of petalPositions) {
    for (let y = p.cy - p.r; y <= p.cy + p.r; y++) {
      for (let x = p.cx - p.r; x <= p.cx + p.r; x++) {
        const dx = x - p.cx;
        const dy = y - p.cy;
        if (dx * dx + dy * dy <= p.r * p.r && y >= 0 && y < size && x >= 0 && x < size) {
          pic[y][x] = p.color;
        }
      }
    }
  }

  // 중심 (노랑)
  for (let y = 11; y <= 17; y++) {
    for (let x = 12; x <= 18; x++) {
      const dx = x - 15;
      const dy = y - 14;
      if (dx * dx + dy * dy <= 9) {
        pic[y][x] = 5;
      }
    }
  }

  // 줄기 (초록)
  for (let y = 18; y < 28; y++) {
    pic[y][15] = 4;
    if (y < 26) pic[y][14] = 4;
  }
  
  // 잎 좌
  for (let i = 0; i < 4; i++) {
    pic[22 + i][13 - i] = 4;
    pic[22 + i][12 - i] = 4;
  }
  // 잎 우
  for (let i = 0; i < 4; i++) {
    pic[20 + i][16 + i] = 4;
    pic[20 + i][17 + i] = 4;
  }

  return pic;
}

// ─── 컬렉션 3: 로켓 (3×3 타일, 각 10×10 = 총 30×30) ───
const ROCKET_PALETTE = ['#E74C3C', '#3498DB', '#ECF0F1', '#F39C12', '#2C3E50'];

function generateRocketPicture() {
  const size = 30;
  const pic = Array(size).fill(null).map(() => Array(size).fill(0));

  // 로켓 본체 (흰색/회색)
  for (let y = 4; y < 22; y++) {
    const halfWidth = y < 8 ? (y - 4) + 1 : y < 18 ? 5 : 5 - (y - 18);
    for (let x = 15 - halfWidth; x <= 15 + halfWidth; x++) {
      if (x >= 0 && x < size) pic[y][x] = 3;
    }
  }
  
  // 코 (빨강)
  for (let y = 2; y < 6; y++) {
    const hw = Math.max(0, y - 3);
    for (let x = 15 - hw; x <= 15 + hw; x++) {
      pic[y][x] = 1;
    }
  }

  // 창문 (파랑)
  for (let y = 9; y <= 12; y++) {
    for (let x = 13; x <= 17; x++) {
      const dx = x - 15;
      const dy = y - 10.5;
      if (dx * dx + dy * dy <= 4) {
        pic[y][x] = 2;
      }
    }
  }

  // 날개 좌 (빨강)
  for (let y = 16; y < 22; y++) {
    const w = Math.min(y - 16 + 1, 3);
    for (let x = 10 - w; x <= 10; x++) {
      if (x >= 0) pic[y][x] = 1;
    }
  }

  // 날개 우 (빨강)
  for (let y = 16; y < 22; y++) {
    const w = Math.min(y - 16 + 1, 3);
    for (let x = 20; x <= 20 + w; x++) {
      if (x < size) pic[y][x] = 1;
    }
  }

  // 화염 (노랑/주황)
  for (let y = 22; y < 28; y++) {
    const intensity = 28 - y;
    const hw = Math.min(intensity, 3);
    for (let x = 15 - hw; x <= 15 + hw; x++) {
      if (x >= 0 && x < size) {
        pic[y][x] = (y % 2 === 0) ? 4 : 1;
      }
    }
  }

  // 별 배경 (작은 점들) - 진한 파랑
  const stars = [[2, 3], [5, 25], [1, 20], [8, 2], [3, 27], [25, 3], [27, 26], [10, 27], [22, 1]];
  for (const [sy, sx] of stars) {
    if (pic[sy][sx] === 0) pic[sy][sx] = 5;
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
