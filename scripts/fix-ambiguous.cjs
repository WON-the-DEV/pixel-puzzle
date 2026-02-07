/**
 * Fix ambiguous puzzles by modifying solutions to be uniquely solvable.
 * Strategy: For each ambiguous puzzle, try flipping cells one at a time
 * until the puzzle becomes uniquely solvable by line solving.
 */
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'puzzleData.js'), 'utf8');
const code = src.replace('export const', 'const') + '\nmodule.exports = HANDMADE_PUZZLES;';
fs.writeFileSync('/tmp/pdata_fix.cjs', code);
const HANDMADE_PUZZLES = require('/tmp/pdata_fix.cjs');

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
    const remainingBlocks = numBlocks - blockIdx - 1;
    const remainingLen = clue.slice(blockIdx + 1).reduce((a, b) => a + b, 0) + remainingBlocks;
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
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 200) {
    changed = false; iterations++;
    for (let i = 0; i < size; i++) {
      const line = grid[i];
      const combos = generateLineCombinations(rowClues[i], size).filter(combo => {
        for (let j = 0; j < size; j++) if (line[j] !== -1 && line[j] !== combo[j]) return false;
        return true;
      });
      if (combos.length === 0) return { solved: false, error: true };
      for (let j = 0; j < size; j++) {
        if (line[j] !== -1) continue;
        if (combos.every(c => c[j] === combos[0][j])) { grid[i][j] = combos[0][j]; changed = true; }
      }
    }
    for (let j = 0; j < size; j++) {
      const line = []; for (let i = 0; i < size; i++) line.push(grid[i][j]);
      const combos = generateLineCombinations(colClues[j], size).filter(combo => {
        for (let i = 0; i < size; i++) if (line[i] !== -1 && line[i] !== combo[i]) return false;
        return true;
      });
      if (combos.length === 0) return { solved: false, error: true };
      for (let i = 0; i < size; i++) {
        if (grid[i][j] !== -1) continue;
        if (combos.every(c => c[i] === combos[0][i])) { grid[i][j] = combos[0][i]; changed = true; }
      }
    }
  }
  const solved = grid.every(row => row.every(cell => cell !== -1));
  return { solved, grid };
}

function isUnique(solution) {
  const { rowClues, colClues } = computeClues(solution);
  const result = lineSolve(rowClues, colClues, solution.length);
  if (!result.solved) return false;
  // Verify match
  for (let i = 0; i < solution.length; i++)
    for (let j = 0; j < solution[i].length; j++)
      if (result.grid[i][j] !== solution[i][j]) return false;
  return true;
}

/**
 * Try to fix an ambiguous puzzle by flipping one cell at a time.
 * Strategy: try adding a filled cell (0->1) or removing one (1->0)
 * at each position, check if the resulting puzzle is uniquely solvable.
 * Prefer minimal changes (single flip).
 */
function fixPuzzle(solution, name) {
  const size = solution.length;
  
  // Try single-cell flips first
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      const newSol = solution.map(r => [...r]);
      newSol[i][j] = newSol[i][j] === 1 ? 0 : 1;
      if (isUnique(newSol)) {
        console.log(`  ✅ Fixed "${name}" by flipping [${i},${j}] from ${solution[i][j]} to ${newSol[i][j]}`);
        return newSol;
      }
    }
  }
  
  // Try two-cell flips
  console.log(`  ⚠️ Trying 2-cell flips for "${name}"...`);
  for (let i1 = 0; i1 < size; i1++) {
    for (let j1 = 0; j1 < size; j1++) {
      for (let i2 = i1; i2 < size; i2++) {
        const j2start = (i2 === i1) ? j1 + 1 : 0;
        for (let j2 = j2start; j2 < size; j2++) {
          const newSol = solution.map(r => [...r]);
          newSol[i1][j1] = newSol[i1][j1] === 1 ? 0 : 1;
          newSol[i2][j2] = newSol[i2][j2] === 1 ? 0 : 1;
          if (isUnique(newSol)) {
            console.log(`  ✅ Fixed "${name}" by flipping [${i1},${j1}] and [${i2},${j2}]`);
            return newSol;
          }
        }
      }
    }
  }
  
  console.log(`  ❌ Could not fix "${name}" with 1-2 flips`);
  return null;
}

// ─── Main ───
const fixes = {};

for (const sizeKey of ['8x8', '10x10']) {
  const puzzles = HANDMADE_PUZZLES[sizeKey];
  console.log(`\n=== ${sizeKey} ===`);
  
  for (let idx = 0; idx < puzzles.length; idx++) {
    const p = puzzles[idx];
    if (!isUnique(p.solution)) {
      console.log(`  Ambiguous: #${idx + 1} ${p.name}`);
      const fixed = fixPuzzle(p.solution, p.name);
      if (fixed) {
        if (!fixes[sizeKey]) fixes[sizeKey] = {};
        fixes[sizeKey][idx] = { name: p.name, solution: fixed };
      }
    }
  }
}

// Output the fixes as JSON for patching
fs.writeFileSync('/tmp/puzzle_fixes.json', JSON.stringify(fixes, null, 2));
console.log('\n=== Fixes saved to /tmp/puzzle_fixes.json ===');
console.log(`Total fixes: ${Object.values(fixes).reduce((s, v) => s + Object.keys(v).length, 0)}`);
