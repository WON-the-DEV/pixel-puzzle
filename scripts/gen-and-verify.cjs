/**
 * Generate and verify new collection tiles for unique solvability.
 */

function computeClues(solution) {
  const size = solution.length;
  const rowClues = [], colClues = [];
  for (let i = 0; i < size; i++) {
    const clue = []; let run = 0;
    for (let j = 0; j < size; j++) {
      if (solution[i][j] === 1) run++;
      else { if (run > 0) { clue.push(run); run = 0; } }
    }
    if (run > 0) clue.push(run);
    rowClues.push(clue.length > 0 ? clue : [0]);
  }
  for (let j = 0; j < size; j++) {
    const clue = []; let run = 0;
    for (let i = 0; i < size; i++) {
      if (solution[i][j] === 1) run++;
      else { if (run > 0) { clue.push(run); run = 0; } }
    }
    if (run > 0) clue.push(run);
    colClues.push(clue.length > 0 ? clue : [0]);
  }
  return { rowClues, colClues };
}

function generateLineCombinations(clue, lineLen) {
  if (clue.length === 1 && clue[0] === 0) return [new Array(lineLen).fill(0)];
  const results = [];
  const numBlocks = clue.length;
  function backtrack(blockIdx, pos, line) {
    if (blockIdx === numBlocks) {
      const result = [...line];
      for (let i = pos; i < lineLen; i++) result[i] = 0;
      results.push(result);
      return;
    }
    const blockLen = clue[blockIdx];
    const remainingLen = clue.slice(blockIdx + 1).reduce((a, b) => a + b, 0) + (numBlocks - blockIdx - 1);
    const maxStart = lineLen - blockLen - remainingLen;
    for (let start = pos; start <= maxStart; start++) {
      const newLine = [...line];
      for (let i = pos; i < start; i++) newLine[i] = 0;
      for (let i = start; i < start + blockLen; i++) newLine[i] = 1;
      if (blockIdx < numBlocks - 1 && start + blockLen < lineLen) {
        newLine[start + blockLen] = 0;
        backtrack(blockIdx + 1, start + blockLen + 1, newLine);
      } else {
        backtrack(blockIdx + 1, start + blockLen, newLine);
      }
    }
  }
  backtrack(0, 0, new Array(lineLen).fill(0));
  return results;
}

function lineSolve(rowClues, colClues, size) {
  const grid = Array.from({ length: size }, () => new Array(size).fill(-1));
  let changed = true, iterations = 0;
  while (changed && iterations < 200) {
    changed = false; iterations++;
    for (let i = 0; i < size; i++) {
      const line = grid[i];
      const combos = generateLineCombinations(rowClues[i], size).filter(c => {
        for (let j = 0; j < size; j++) { if (line[j] !== -1 && line[j] !== c[j]) return false; }
        return true;
      });
      if (!combos.length) return { solved: false, error: `Row ${i}` };
      for (let j = 0; j < size; j++) {
        if (line[j] !== -1) continue;
        if (combos.every(c => c[j] === combos[0][j])) { grid[i][j] = combos[0][j]; changed = true; }
      }
    }
    for (let j = 0; j < size; j++) {
      const line = grid.map(r => r[j]);
      const combos = generateLineCombinations(colClues[j], size).filter(c => {
        for (let i = 0; i < size; i++) { if (line[i] !== -1 && line[i] !== c[i]) return false; }
        return true;
      });
      if (!combos.length) return { solved: false, error: `Col ${j}` };
      for (let i = 0; i < size; i++) {
        if (grid[i][j] !== -1) continue;
        if (combos.every(c => c[i] === combos[0][i])) { grid[i][j] = combos[0][i]; changed = true; }
      }
    }
  }
  const solved = grid.every(r => r.every(c => c !== -1));
  return { solved, grid, iterations };
}

function verifyTile(tile, tileSize) {
  const mono = tile.map(row => row.map(c => c > 0 ? 1 : 0));
  const filled = mono.flat().filter(c => c === 1).length;
  if (filled === 0) return { empty: true };
  const fillRate = filled / (tileSize * tileSize);
  const { rowClues, colClues } = computeClues(mono);
  const result = lineSolve(rowClues, colClues, tileSize);
  return { ...result, filled, fillRate };
}

function extractTile(bigPicture, tileRow, tileCol, tileSize) {
  const startR = tileRow * tileSize;
  const startC = tileCol * tileSize;
  const tile = [];
  for (let r = 0; r < tileSize; r++) {
    const row = [];
    for (let c = 0; c < tileSize; c++) {
      const pr = startR + r, pc = startC + c;
      row.push((pr < bigPicture.length && pc < bigPicture[0].length) ? bigPicture[pr][pc] : 0);
    }
    tile.push(row);
  }
  return tile;
}

function verifyBigPicture(name, bigPicture, tileRows, tileCols, tileSize) {
  console.log(`\n── ${name} (${tileSize}×${tileSize} tiles, ${tileRows}×${tileCols} grid) ──`);
  let pass = 0, fail = 0, empty = 0;
  const fillRates = [];
  
  for (let tr = 0; tr < tileRows; tr++) {
    for (let tc = 0; tc < tileCols; tc++) {
      const tile = extractTile(bigPicture, tr, tc, tileSize);
      const result = verifyTile(tile, tileSize);
      const num = tr * tileCols + tc + 1;
      
      if (result.empty) { empty++; continue; }
      
      const fillPct = (result.fillRate * 100).toFixed(0);
      fillRates.push(result.fillRate);
      if (result.solved) {
        console.log(`  ✅ #${num} [${tr},${tc}] — unique (${fillPct}% fill, ${result.iterations} iter)`);
        pass++;
      } else {
        let unknowns = 0;
        if (result.grid) result.grid.forEach(row => row.forEach(cell => { if (cell === -1) unknowns++; }));
        console.log(`  ❌ #${num} [${tr},${tc}] — FAIL (${fillPct}% fill, ${unknowns} unknowns)`);
        const mono = tile.map(row => row.map(c => c > 0 ? '█' : '·').join(''));
        mono.forEach(r => console.log(`     ${r}`));
        fail++;
      }
    }
  }
  
  const avgFill = fillRates.length > 0 ? (fillRates.reduce((a, b) => a + b, 0) / fillRates.length * 100).toFixed(0) : 0;
  console.log(`  Result: ${pass} pass, ${fail} fail, ${empty} empty | Avg fill: ${avgFill}%`);
  return { pass, fail, empty };
}

// ══════════════════════════════════════════════════════
// New collections
// ══════════════════════════════════════════════════════

// ─── Music Note: 3×3 tiles, each 5×5 = 15×15 ───
// Palette: black(1), purple(2)
const MUSIC_PICTURE = [
  // Row 0-4 (tile row 0) — note head top + beam
  [0,0,0,0,0, 0,0,0,0,1, 1,1,1,1,1],
  [0,0,0,0,0, 0,0,0,1,1, 1,1,1,1,1],
  [0,0,0,0,0, 0,0,0,1,1, 0,0,0,1,1],
  [0,0,0,0,0, 0,0,0,1,1, 0,0,0,1,1],
  [0,0,0,0,0, 0,0,0,1,1, 0,0,0,1,1],
  // Row 5-9 (tile row 1) — stems
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  [0,0,0,0,0, 0,0,0,1,0, 0,0,0,1,0],
  // Row 10-14 (tile row 2) — note heads (ovals)
  [0,0,2,2,2, 2,0,0,1,0, 2,2,2,2,0],
  [0,2,2,2,2, 2,2,0,1,0, 2,2,2,2,2],
  [0,2,2,2,2, 2,2,1,1,0, 2,2,2,2,2],
  [0,2,2,2,2, 2,2,0,0,0, 2,2,2,2,2],
  [0,0,2,2,2, 2,0,0,0,0, 0,2,2,2,0],
];

// ─── Wave: 4×3 tiles, each 5×5 = 20×15 ───
// Palette: blue(1), white(2), yellow(3)
const WAVE_PICTURE = [
  // Row 0-4 (tile row 0) — sky with sun
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 3,3,0,0,0],
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,3, 3,3,3,0,0],
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,3, 3,3,3,0,0],
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 3,3,0,0,0],
  [0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0, 0,0,0,0,0],
  // Row 5-9 (tile row 1) — wave crests
  [0,0,1,1,0, 0,0,0,0,0, 0,1,1,0,0, 0,0,0,0,0],
  [0,1,1,1,1, 0,0,0,0,0, 1,1,1,1,0, 0,0,0,0,0],
  [1,1,2,2,1, 1,0,0,0,1, 1,2,2,1,1, 0,0,0,0,0],
  [1,2,2,2,2, 1,1,0,1,1, 2,2,2,2,1, 1,0,0,0,1],
  [1,2,2,2,1, 1,1,1,1,1, 2,2,2,1,1, 1,1,1,1,1],
  // Row 10-14 (tile row 2) — wave body
  [1,1,2,1,1, 1,1,1,1,1, 1,2,1,1,1, 1,1,1,1,1],
  [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
  [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
  [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
  [1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1],
];

// ─── Fantasy Castle: 5×5 tiles, each 5×5 = 25×25 ───
// Palette: grey/stone(1), blue/water(2), green/grass(3), red/flag(4), brown/gate(5)
// 0 = empty (background/sky)
const CASTLE_PICTURE = [
  // Row 0-4 (tile row 0) — sky + flag poles + tower tips
  [0,0,0,0,0, 0,0,4,0,0, 0,0,0,0,0, 0,0,4,0,0, 0,0,0,0,0],
  [0,0,0,0,0, 0,0,4,1,0, 0,0,4,0,0, 0,1,4,0,0, 0,0,0,0,0],
  [0,0,0,0,0, 0,1,1,1,0, 0,0,4,0,0, 0,1,1,1,0, 0,0,0,0,0],
  [0,0,0,0,0, 0,1,1,1,0, 0,1,1,1,0, 0,1,1,1,0, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 0,0,0,0,0],
  // Row 5-9 (tile row 1) — battlements + upper wall
  [0,0,0,0,0, 1,0,1,0,1, 1,0,1,0,1, 1,0,1,0,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,0,1,1, 1,1,0,1,1, 1,1,0,1,1, 0,0,0,0,0],
  [0,0,0,0,0, 1,1,0,1,1, 1,1,0,1,1, 1,1,0,1,1, 0,0,0,0,0],
  // Row 10-14 (tile row 2) — middle wall + gate arch top
  [0,0,0,0,1, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 1,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,1, 1,0,5,0,1, 1,1,1,1,1, 1,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,1, 0,5,5,5,0, 1,1,1,1,1, 1,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,0, 5,5,5,5,5, 0,1,1,1,1, 1,0,0,0,0],
  [0,0,0,0,1, 1,1,1,1,0, 5,5,5,5,5, 0,1,1,1,1, 1,0,0,0,0],
  // Row 15-19 (tile row 3) — lower wall + gate + grass sides
  [3,3,3,3,1, 1,1,1,1,0, 5,5,5,5,5, 0,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,1, 1,1,1,1,0, 5,5,5,5,5, 0,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,1, 1,1,1,1,0, 5,0,0,0,5, 0,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,1, 1,1,1,1,0, 5,0,0,0,5, 0,1,1,1,1, 1,3,3,3,3],
  [3,3,3,3,1, 1,1,1,1,1, 5,5,5,5,5, 1,1,1,1,1, 1,3,3,3,3],
  // Row 20-24 (tile row 4) — ground + moat + grass
  [3,3,3,3,3, 1,1,1,1,1, 1,1,1,1,1, 1,1,1,1,1, 3,3,3,3,3],
  [3,3,3,3,3, 3,2,2,2,2, 2,2,2,2,2, 2,2,2,2,3, 3,3,3,3,3],
  [3,3,3,3,3, 2,2,2,2,2, 2,2,2,2,2, 2,2,2,2,2, 3,3,3,3,3],
  [3,3,3,3,3, 3,3,2,2,2, 2,2,2,2,2, 2,2,2,3,3, 3,3,3,3,3],
  [3,3,3,3,3, 3,3,3,3,3, 3,3,3,3,3, 3,3,3,3,3, 3,3,3,3,3],
];

console.log('=== New Collection Tile Verification ===');

const results = [];
results.push(verifyBigPicture('🎵 Music Note', MUSIC_PICTURE, 3, 3, 5));
results.push(verifyBigPicture('🌊 Wave', WAVE_PICTURE, 3, 4, 5));
results.push(verifyBigPicture('🏰 Fantasy Castle', CASTLE_PICTURE, 5, 5, 5));

const totalFail = results.reduce((a, r) => a + r.fail, 0);
if (totalFail > 0) {
  console.log(`\n⚠️ ${totalFail} tiles failed — need fixing`);
  process.exit(1);
} else {
  console.log('\n✅ All tiles verified!');
}
