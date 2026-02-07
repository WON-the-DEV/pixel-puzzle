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

// Generate flower picture with uniquely-solvable tiles
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
  
  // Corner decorations — structured shapes for unique solvability
  // Top-left [0,0]: connected L-shapes and lines (no isolated dots)
  const budsTopLeft = [
    // Horizontal bar across row 1
    [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
    // Vertical bar col 3
    [2, 3], [3, 3], [4, 3], [5, 3],
    // Small cross at (7,5)
    [6, 5], [7, 4], [7, 5], [7, 6], [8, 5],
    // Diagonal steps
    [4, 7], [5, 8], [6, 9],
    // Bottom row fill
    [8, 1], [8, 2], [9, 0], [9, 1], [9, 2], [9, 3],
  ];
  for (const [by, bx] of budsTopLeft) {
    if (by < size && bx < size && pic[by][bx] === 0) pic[by][bx] = 4;
  }
  // Top-right [0,2]: structured decoration
  const topRight = [
    // Horizontal bar
    [1, 24], [1, 25], [1, 26], [1, 27],
    // L-shape
    [2, 27], [3, 27], [3, 26], [3, 25],
    // Connected block
    [5, 24], [5, 25], [6, 24], [6, 25],
    // Vertical bar
    [7, 28], [8, 28], [9, 28], [9, 27],
    // Row fill at bottom
    [9, 20], [9, 21], [9, 22], [9, 23],
  ];
  for (const [by, bx] of topRight) {
    if (by < size && bx < size && pic[by][bx] === 0) pic[by][bx] = 2;
  }
  // Bottom-left [2,0]: structured L and bar shapes
  const botLeft = [
    // Top bar
    [20, 0], [20, 1], [20, 2], [20, 3],
    // Vertical descent
    [21, 0], [22, 0], [23, 0],
    // Connected block
    [24, 2], [24, 3], [25, 2], [25, 3],
    // Horizontal bar
    [27, 1], [27, 2], [27, 3], [27, 4],
    // L-shape bottom
    [28, 4], [29, 2], [29, 3], [29, 4],
    // Extra for fill rate
    [26, 6], [26, 7], [27, 7],
  ];
  for (const [by, bx] of botLeft) {
    if (by < size && bx < size && pic[by][bx] === 0) pic[by][bx] = 4;
  }
  // Bottom-right [2,2]: keep existing but add more structure
  const botRight = [
    // Connected block
    [26, 26], [26, 27], [27, 26], [27, 27],
    // Horizontal bar
    [28, 24], [28, 25], [28, 26], [28, 27],
    // Vertical bar
    [29, 25], [29, 26],
    // Extra
    [24, 28], [25, 28], [25, 29],
  ];
  for (const [by, bx] of botRight) {
    if (by < size && bx < size && pic[by][bx] === 0) pic[by][bx] = 1;
  }

  // Post-process: ensure each 10x10 tile has enough connected content
  // Add horizontal bars to sparse areas for unique solvability
  ensureTilesSolvable(pic, 10, 3, 3, 4);

  return pic;
}

// ─── Helper: ensure tiles are uniquely solvable by line solving ───
// Uses an inline line solver to verify and iteratively adds structure
function ensureTilesSolvable(pic, tileSize, tileRows, tileCols, fillColor) {
  const size = pic.length;
  const cols = (pic[0] || []).length;
  
  function computeClues(monoGrid) {
    const sz = monoGrid.length;
    const rowClues = [], colClues = [];
    for (let i = 0; i < sz; i++) {
      const c = []; let run = 0;
      for (let j = 0; j < sz; j++) { if (monoGrid[i][j]===1) run++; else { if(run>0){c.push(run);run=0;} } }
      if (run>0) c.push(run);
      rowClues.push(c.length>0?c:[0]);
    }
    for (let j = 0; j < sz; j++) {
      const c = []; let run = 0;
      for (let i = 0; i < sz; i++) { if (monoGrid[i][j]===1) run++; else { if(run>0){c.push(run);run=0;} } }
      if (run>0) c.push(run);
      colClues.push(c.length>0?c:[0]);
    }
    return { rowClues, colClues };
  }
  
  function genLineCombos(clue, len) {
    if (clue.length===1&&clue[0]===0) return [new Array(len).fill(0)];
    const results = [];
    const nb = clue.length;
    function bt(bi, pos, line) {
      if (bi===nb) { const r=[...line]; for(let i=pos;i<len;i++)r[i]=0; results.push(r); return; }
      const rl = clue.slice(bi+1).reduce((a,b)=>a+b,0)+(nb-bi-1);
      for(let s=pos;s<=len-clue[bi]-rl;s++){
        const nl=[...line]; for(let i=pos;i<s;i++)nl[i]=0;
        for(let i=s;i<s+clue[bi];i++)nl[i]=1;
        if(bi<nb-1&&s+clue[bi]<len){nl[s+clue[bi]]=0;bt(bi+1,s+clue[bi]+1,nl);}
        else bt(bi+1,s+clue[bi],nl);
      }
    }
    bt(0,0,new Array(len).fill(0));
    return results;
  }
  
  function isTileSolvable(monoGrid) {
    const sz = monoGrid.length;
    const {rowClues, colClues} = computeClues(monoGrid);
    const grid = monoGrid.map(r=>r.map(()=>-1));
    let changed = true, iter = 0;
    while(changed && iter<200) {
      changed=false; iter++;
      for(let i=0;i<sz;i++){
        const line = grid[i];
        const combos = genLineCombos(rowClues[i],sz).filter(c=>{for(let j=0;j<sz;j++){if(line[j]!==-1&&line[j]!==c[j])return false;}return true;});
        if(!combos.length)return false;
        for(let j=0;j<sz;j++){if(line[j]!==-1)continue;if(combos.every(c=>c[j]===combos[0][j])){grid[i][j]=combos[0][j];changed=true;}}
      }
      for(let j=0;j<sz;j++){
        const line = grid.map(r=>r[j]);
        const combos = genLineCombos(colClues[j],sz).filter(c=>{for(let i=0;i<sz;i++){if(line[i]!==-1&&line[i]!==c[i])return false;}return true;});
        if(!combos.length)return false;
        for(let i=0;i<sz;i++){if(grid[i][j]!==-1)continue;if(combos.every(c=>c[i]===combos[0][i])){grid[i][j]=combos[0][i];changed=true;}}
      }
    }
    return grid.every(r=>r.every(c=>c!==-1));
  }

  for (let tr = 0; tr < tileRows; tr++) {
    for (let tc = 0; tc < tileCols; tc++) {
      const startR = tr * tileSize;
      const startC = tc * tileSize;
      
      // Extract mono tile
      const mono = [];
      let hasFilled = false;
      for (let r = 0; r < tileSize; r++) {
        const row = [];
        for (let c = 0; c < tileSize; c++) {
          const pr = startR + r, pc = startC + c;
          const val = (pr < size && pc < cols) ? (pic[pr][pc] > 0 ? 1 : 0) : 0;
          row.push(val);
          if (val) hasFilled = true;
        }
        mono.push(row);
      }
      if (!hasFilled) continue;
      
      if (isTileSolvable(mono)) continue;
      
      // Not uniquely solvable — try adding structure iteratively
      // Strategy: add full horizontal bars, then vertical bars, then cross, until solvable
      const attempts = [
        // Try adding a horizontal bar at each row
        ...Array.from({length: tileSize}, (_, r) => ({type: 'hbar', row: r})),
        // Try adding a vertical bar at each column
        ...Array.from({length: tileSize}, (_, c) => ({type: 'vbar', col: c})),
        // Full cross
        {type: 'cross'},
      ];
      
      let solved = false;
      for (const attempt of attempts) {
        const testMono = mono.map(r => [...r]);
        
        if (attempt.type === 'hbar') {
          // Fill the entire row (empty cells only)
          for (let c = 0; c < tileSize; c++) {
            if (testMono[attempt.row][c] === 0) testMono[attempt.row][c] = 1;
          }
        } else if (attempt.type === 'vbar') {
          for (let r = 0; r < tileSize; r++) {
            if (testMono[r][attempt.col] === 0) testMono[r][attempt.col] = 1;
          }
        } else if (attempt.type === 'cross') {
          const mid = Math.floor(tileSize / 2);
          for (let c = 0; c < tileSize; c++) { if (testMono[mid][c] === 0) testMono[mid][c] = 1; }
          for (let r = 0; r < tileSize; r++) { if (testMono[r][mid] === 0) testMono[r][mid] = 1; }
        }
        
        if (isTileSolvable(testMono)) {
          // Apply to pic
          for (let r = 0; r < tileSize; r++) {
            for (let c = 0; c < tileSize; c++) {
              if (testMono[r][c] === 1 && mono[r][c] === 0) {
                const pr = startR + r, pc = startC + c;
                if (pr < size && pc < cols) pic[pr][pc] = fillColor;
              }
            }
          }
          solved = true;
          break;
        }
      }
      
      if (!solved) {
        // Last resort: add both a horizontal and vertical bar
        for (let rowOff = 0; rowOff < tileSize && !solved; rowOff++) {
          for (let colOff = 0; colOff < tileSize && !solved; colOff++) {
            const testMono = mono.map(r => [...r]);
            for (let c = 0; c < tileSize; c++) { if (testMono[rowOff][c] === 0) testMono[rowOff][c] = 1; }
            for (let r = 0; r < tileSize; r++) { if (testMono[r][colOff] === 0) testMono[r][colOff] = 1; }
            if (isTileSolvable(testMono)) {
              for (let r = 0; r < tileSize; r++) {
                for (let c = 0; c < tileSize; c++) {
                  if (testMono[r][c] === 1 && mono[r][c] === 0) {
                    const pr = startR + r, pc = startC + c;
                    if (pr < size && pc < cols) pic[pr][pc] = fillColor;
                  }
                }
              }
              solved = true;
            }
          }
        }
      }
    }
  }
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

  // 별 배경 + 행성/성운 — all tiles get structured content for unique solvability
  // (No isolated single dots — only connected shapes)

  // Planet top-left [0,0] — larger connected planet with ring
  const planetTL = [
    // Planet body (solid block)
    [2, 2], [2, 3], [2, 4], [2, 5],
    [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6],
    [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6],
    [5, 2], [5, 3], [5, 4], [5, 5],
    // Ring around planet
    [1, 3], [1, 4],
    [6, 3], [6, 4],
    // Stars as short lines (not single dots)
    [0, 7], [0, 8],
    [7, 0], [7, 1],
    [8, 6], [8, 7],
    [9, 1], [9, 2], [9, 3],
  ];
  for (const [py, px] of planetTL) {
    if (pic[py][px] === 0) pic[py][px] = 2;
  }
  
  // Space station mid-left [1,0] — structured grid pattern
  const stationML = [
    // Horizontal bars
    [10, 0], [10, 1], [10, 2], [10, 3], [10, 4], [10, 5], [10, 6], [10, 7], [10, 8],
    [12, 0], [12, 1], [12, 2], [12, 3], [12, 4], [12, 5], [12, 6], [12, 7], [12, 8],
    [14, 0], [14, 1], [14, 2], [14, 3], [14, 4], [14, 5], [14, 6], [14, 7], [14, 8], [14, 9],
    [16, 0], [16, 1], [16, 2], [16, 3], [16, 4], [16, 5], [16, 6], [16, 7],
    [18, 1], [18, 2], [18, 3], [18, 4], [18, 5], [18, 6],
    // Vertical connectors
    [11, 2], [11, 5], [11, 8],
    [13, 2], [13, 5],
    [15, 2], [15, 5],
    [17, 3], [17, 4], [17, 5],
    [19, 2], [19, 3], [19, 4],
  ];
  for (const [sy, sx] of stationML) {
    if (sy < size && sx < size && pic[sy][sx] === 0) pic[sy][sx] = 3;
  }
  
  // Nebula top-right [0,2] — larger connected shape
  const nebulaTR = [
    // Cloud shape
    [1, 22], [1, 23], [1, 24],
    [2, 21], [2, 22], [2, 23], [2, 24], [2, 25],
    [3, 22], [3, 23], [3, 24], [3, 25], [3, 26],
    [4, 23], [4, 24], [4, 25],
    // Tail
    [5, 25], [5, 26], [6, 26], [6, 27],
    // Star lines (connected)
    [7, 22], [7, 23],
    [8, 28], [8, 29],
    [9, 21], [9, 22], [9, 23],
  ];
  for (const [ny, nx] of nebulaTR) {
    if (nx < size && pic[ny][nx] === 0) pic[ny][nx] = 4;
  }

  // Right side of mid tiles [1,2] — add more structure
  const midRight = [
    // Comet shape
    [10, 22], [10, 23], [10, 24], [10, 25],
    [11, 25], [11, 26],
    [12, 26], [12, 27],
    // Galaxy swirl
    [14, 25], [14, 26], [14, 27],
    [15, 24], [15, 27], [15, 28],
    [16, 25], [16, 26], [16, 27],
    // Star cluster
    [18, 22], [18, 23], [18, 24],
    [19, 22], [19, 24],
  ];
  for (const [my, mx] of midRight) {
    if (my < size && mx < size && pic[my][mx] === 0) pic[my][mx] = 5;
  }
  
  // Asteroid cluster bottom-left [2,0] — larger connected shapes
  const asteroidBL = [
    // Large asteroid
    [21, 2], [21, 3], [21, 4],
    [22, 1], [22, 2], [22, 3], [22, 4], [22, 5],
    [23, 1], [23, 2], [23, 3], [23, 4], [23, 5],
    [24, 2], [24, 3], [24, 4],
    // Small asteroid
    [26, 6], [26, 7],
    [27, 5], [27, 6], [27, 7], [27, 8],
    [28, 6], [28, 7],
    // Star lines
    [20, 8], [20, 9],
    [29, 0], [29, 1], [29, 2],
  ];
  for (const [ay, ax] of asteroidBL) {
    if (ay < size && pic[ay][ax] === 0) pic[ay][ax] = 3;
  }
  
  // Moon bottom-right [2,2] — larger connected crescent
  const moonBR = [
    // Crescent moon
    [21, 25], [21, 26], [21, 27],
    [22, 24], [22, 25], [22, 27], [22, 28],
    [23, 24], [23, 28],
    [24, 24], [24, 25], [24, 27], [24, 28],
    [25, 25], [25, 26], [25, 27],
    // Star lines
    [27, 22], [27, 23],
    [28, 28], [28, 29],
    [29, 24], [29, 25], [29, 26],
  ];
  for (const [my, mx] of moonBR) {
    if (my < size && mx < size && pic[my][mx] === 0) pic[my][mx] = 3;
  }

  // Post-process: ensure each 10x10 tile has enough connected content
  ensureTilesSolvable(pic, 10, 3, 3, 5);

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
  [0,0,0,3,3,3,0,4,1,1,4,1,1,4,1,1,4,1,4,0],
  [3,3,3,0,0,3,4,1,1,1,1,4,4,1,1,1,1,1,4,0],
  [0,3,3,3,0,0,4,1,1,4,1,1,1,4,1,1,4,4,0,0],
  [0,0,3,3,3,0,4,1,1,1,4,4,4,1,1,1,4,0,0,0],
  [0,0,0,0,0,0,0,4,1,1,1,1,1,1,1,4,0,0,0,0],
  // Row 10-14 (Tile row 2) — 하체 + 뒷지느러미 + 꼬리
  [0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,0,0,0,0,0],
  [0,0,0,0,0,3,3,3,0,0,0,0,0,0,0,3,3,3,0,0],
  [0,0,0,0,0,3,3,3,0,0,0,0,0,0,3,3,3,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
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

// ─── 컬렉션 8: 음표 (3×3 타일, 각 5×5 = 총 15×15) ───
const MUSIC_PALETTE = ['#2C3E50', '#8B5CF6'];

// 15×15 음표 pixel art — 검정(1), 보라(2)
const MUSIC_PICTURE = [
  [0,0,0,0,0, 0,0,0,0,1, 1,1,1,1,1],
  [0,0,0,0,0, 0,0,0,1,1, 1,1,1,1,1],
  [0,0,0,0,0, 0,0,0,1,1, 0,0,0,1,1],
  [0,0,0,0,0, 0,0,0,1,1, 0,0,0,1,1],
  [0,0,0,0,0, 0,0,0,1,1, 0,0,0,1,1],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,2,2,2, 2,0,0,1,0, 2,2,2,2,0],
  [0,2,2,2,2, 2,2,0,1,0, 2,2,2,2,2],
  [0,2,2,2,2, 2,2,1,1,0, 2,2,2,2,2],
  [0,2,2,2,2, 2,2,0,0,0, 2,2,2,2,2],
  [0,0,2,2,2, 2,0,0,0,0, 0,2,2,2,0],
];

// ─── 컬렉션 9: 파도 (4×3 타일, 각 5×5 = 총 20×15) ───
const WAVE_PALETTE = ['#3498DB', '#ECF0F1', '#F1C40F'];

// 15×20 파도 + 해 pixel art — 파랑(1), 흰색(2), 노랑(3)
const WAVE_PICTURE = [
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 3,3,0,0,0],
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,3, 3,3,3,0,0],
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,3, 3,3,3,0,0],
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 3,3,0,0,0],
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
  [0,0,1,1,0, 0,0,0,0,0, 0,1,1,0,0, 0,0,0,0,0],
  [0,1,1,1,1, 0,0,0,0,0, 1,1,1,1,0, 0,0,0,0,0],
  [1,1,2,2,1, 1,0,0,0,1, 1,2,2,1,1, 0,0,0,0,0],
  [1,2,2,2,2, 1,1,0,1,1, 2,2,2,2,1, 1,0,0,0,1],
  [1,2,2,2,1, 1,1,1,1,1, 2,2,2,1,1, 1,1,1,1,1],
  [1,1,2,1,1, 1,1,1,1,1, 1,2,1,1,1, 1,1,1,1,1],
  [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
  [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
  [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
  [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
];

// ─── 컬렉션 10: 판타지 성 (5×5 타일, 각 5×5 = 총 25×25) ───
const CASTLE_PALETTE = ['#95A5A6', '#3498DB', '#2ECC71', '#E74C3C', '#8B6914'];

// 25×25 판타지 성 pixel art — 회색/돌(1), 파랑/물(2), 초록/잔디(3), 빨강/깃발(4), 갈색/문(5)
const CASTLE_PICTURE = [
  [0,0,0,0,0, 0,0,4,0,0, 0,0,0,0,0, 0,0,4,0,0, 0,0,0,0,0],
  [0,0,0,0,0, 0,0,4,1,0, 0,0,4,0,0, 0,1,4,0,0, 0,0,0,0,0],
  [0,0,0,0,0, 0,1,1,1,0, 0,0,4,0,0, 0,1,1,1,0, 0,0,0,0,0],
  [0,0,0,0,0, 0,1,1,1,0, 0,1,1,1,0, 0,1,1,1,0, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,0,1,0,1, 1,0,1,0,1, 1,0,1,0,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,0,1,1, 1,1,0,1,1, 1,1,0,1,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,0,1,1, 1,1,0,1,1, 1,1,0,1,1, 0,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,1, 1,0,5,0,1, 1,1,1,1,1, 1,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,1, 0,5,5,5,0, 1,1,1,1,1, 1,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,0, 5,5,5,5,5, 0,1,1,1,1, 1,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,0, 5,5,5,5,5, 0,1,1,1,1, 1,0,0,0,0],
  [3,3,3,3,1, 1,1,1,1,0, 5,5,5,5,5, 0,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,1, 1,1,1,1,0, 5,5,5,5,5, 0,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,1, 1,1,1,1,0, 5,0,0,0,5, 0,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,1, 1,1,1,1,0, 5,0,0,0,5, 0,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,1, 1,1,1,1,1, 5,5,5,5,5, 1,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,3, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 3,3,3,3,3],
  [3,3,3,3,3, 3,2,2,2,2, 2,2,2,2,2, 2,2,2,2,3, 3,3,3,3,3],
  [3,3,3,3,3, 2,2,2,2,2, 2,2,2,2,2, 2,2,2,2,2, 3,3,3,3,3],
  [3,3,3,3,3, 3,3,2,2,2, 2,2,2,2,2, 2,2,2,3,3, 3,3,3,3,3],
  [3,3,3,3,3, 3,3,3,3,3, 3,3,3,3,3, 3,3,3,3,3, 3,3,3,3,3],
];

// ─── 난이도 순 정렬된 컬렉션 목록 ───
// 입문 → 초급 → 중급 → 고급 → 마스터
export const COLLECTION_DATA = [
  // ── 입문 (5×5 타일) ──
  {
    id: 'heart',
    name: '사랑의 하트',
    emoji: '❤️',
    description: '7개의 퍼즐을 풀어 하트를 완성하세요',
    palette: HEART_PALETTE,
    bigPicture: HEART_PICTURE,
    tileRows: 3,
    tileCols: 3,
    tileSize: 5,
    difficulty: '입문',
    color: '#FF6B6B',
  },
  {
    id: 'tree',
    name: '크리스마스 트리',
    emoji: '🎄',
    description: '7개의 퍼즐을 풀어 트리를 완성하세요',
    palette: TREE_PALETTE,
    bigPicture: TREE_PICTURE,
    tileRows: 3,
    tileCols: 3,
    tileSize: 5,
    difficulty: '입문',
    color: '#2ECC71',
  },
  {
    id: 'music',
    name: '음표',
    emoji: '🎵',
    description: '7개의 퍼즐을 풀어 음표를 완성하세요',
    palette: MUSIC_PALETTE,
    bigPicture: MUSIC_PICTURE,
    tileRows: 3,
    tileCols: 3,
    tileSize: 5,
    difficulty: '입문',
    color: '#8B5CF6',
  },
  // ── 초급 (5×5 타일, 더 많은 타일) ──
  {
    id: 'cat',
    name: '귀여운 고양이',
    emoji: '🐱',
    description: '15개의 퍼즐을 풀어 고양이를 완성하세요',
    palette: CAT_PALETTE,
    bigPicture: CAT_PICTURE,
    tileRows: 4,
    tileCols: 4,
    tileSize: 5,
    difficulty: '초급',
    color: '#F39C12',
  },
  {
    id: 'turtle',
    name: '바다거북',
    emoji: '🐢',
    description: '11개의 퍼즐을 풀어 거북이를 완성하세요',
    palette: TURTLE_PALETTE,
    bigPicture: (() => { const p = TURTLE_PICTURE.map(r=>[...r]); ensureTilesSolvable(p,5,3,4,4); return p; })(),
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
  {
    id: 'wave',
    name: '파도',
    emoji: '🌊',
    description: '10개의 퍼즐을 풀어 파도를 완성하세요',
    palette: WAVE_PALETTE,
    bigPicture: WAVE_PICTURE,
    tileRows: 3,
    tileCols: 4,
    tileSize: 5,
    difficulty: '초급',
    color: '#3498DB',
  },
  // ── 중급 (10×10 타일) ──
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
  // ── 고급 (10×10 타일) ──
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
  // ── 마스터 (5×5 타일, 25 퍼즐) ──
  {
    id: 'castle',
    name: '판타지 성',
    emoji: '🏰',
    description: '21개의 퍼즐을 풀어 성을 완성하세요',
    palette: CASTLE_PALETTE,
    bigPicture: CASTLE_PICTURE,
    tileRows: 5,
    tileCols: 5,
    tileSize: 5,
    difficulty: '마스터',
    color: '#95A5A6',
  },
];

/**
 * 퍼즐 오버라이드 — 채움률 90%+ 타일에 대해 별도 퍼즐 패턴 제공
 * bigPicture는 완성형 유지, 퍼즐 자체는 적정 채움률(30-70%)의 독립 패턴
 * 모든 패턴은 line-solving으로 유일해 검증 완료
 */
const PUZZLE_OVERRIDES = {
  'heart-1-1':[[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]],
  'tree-1-1':[[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]],
  'cat-1-0':[[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0]],
  'cat-1-1':[[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0]],
  'cat-1-2':[[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1]],
  'cat-2-1':[[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1]],
  'cat-2-2':[[1,1,1,1,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1]],
  'turtle-1-2':[[1,1,0,0,0],[1,1,1,0,0],[1,1,1,1,1],[1,1,1,0,0],[1,1,0,0,0]],
  'food-0-1':[[1,0,0,0,0],[1,1,0,0,0],[1,1,1,0,0],[1,1,1,1,0],[1,1,1,1,1]],
  'food-1-1':[[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1]],
  'wave-2-0':[[1,1,0,1,1],[1,0,0,0,1],[0,0,0,0,0],[1,0,0,0,1],[1,1,0,1,1]],
  'wave-2-1':[[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1]],
  'wave-2-2':[[1,1,0,1,1],[1,0,0,0,1],[0,0,0,0,0],[1,0,0,0,1],[1,1,0,1,1]],
  'wave-2-3':[[0,0,1,0,0],[0,0,1,0,0],[1,0,1,0,1],[0,1,1,1,0],[0,0,1,0,0]],
  'castle-2-1':[[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,1,1,1,1]],
  'castle-2-3':[[0,0,1,0,0],[0,1,1,1,0],[0,0,1,0,0],[1,0,1,0,1],[0,1,1,1,0]],
  'castle-3-0':[[0,1,1,1,0],[1,1,1,1,1],[0,0,1,0,0],[0,1,1,1,0],[0,1,1,1,0]],
  'castle-3-4':[[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0]],
  'castle-4-0':[[1,1,1,1,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,1,1,1,1]],
  'castle-4-1':[[1,0,0,0,1],[1,1,0,1,1],[1,1,1,1,1],[1,1,0,1,1],[1,0,0,0,1]],
  'castle-4-2':[[0,1,0,1,0],[1,1,1,1,1],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]],
  'castle-4-3':[[0,0,1,0,0],[0,1,1,1,0],[1,1,1,1,1],[0,1,1,1,0],[0,0,1,0,0]],
  'castle-4-4':[[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0]],
};

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
  const { solution: originalSolution, palette } = extractTilePuzzle(collection, tileRow, tileCol);
  const size = originalSolution.length;
  
  // 퍼즐 오버라이드 확인 — 채움률 높은 타일은 별도 퍼즐 패턴 사용
  const overrideKey = `${collection.id}-${tileRow}-${tileCol}`;
  const override = PUZZLE_OVERRIDES[overrideKey];
  
  // override가 있으면 mono(0/1) 패턴 사용, 없으면 원본 solution 사용
  const solution = override || originalSolution;
  
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
