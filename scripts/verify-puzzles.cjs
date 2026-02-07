/**
 * Verify that all 15x15 puzzles have a unique solution via line solving (constraint propagation).
 * Usage: node scripts/verify-puzzles.js
 */
const fs = require('fs');
const path = require('path');

// Load puzzle data
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'puzzleData.js'), 'utf8');
const code = src.replace('export const', 'const') + '\nmodule.exports = HANDMADE_PUZZLES;';
fs.writeFileSync('/tmp/pdata_verify.cjs', code);
const HANDMADE_PUZZLES = require('/tmp/pdata_verify.cjs');

/**
 * Compute row/col clues from a solution grid
 */
function computeClues(solution) {
  const size = solution.length;
  const rowClues = [];
  const colClues = [];

  for (let i = 0; i < size; i++) {
    const clue = [];
    let run = 0;
    for (let j = 0; j < size; j++) {
      if (solution[i][j] === 1) { run++; }
      else { if (run > 0) { clue.push(run); run = 0; } }
    }
    if (run > 0) clue.push(run);
    rowClues.push(clue.length > 0 ? clue : [0]);
  }

  for (let j = 0; j < size; j++) {
    const clue = [];
    let run = 0;
    for (let i = 0; i < size; i++) {
      if (solution[i][j] === 1) { run++; }
      else { if (run > 0) { clue.push(run); run = 0; } }
    }
    if (run > 0) clue.push(run);
    colClues.push(clue.length > 0 ? clue : [0]);
  }

  return { rowClues, colClues };
}

/**
 * Generate all valid line arrangements for a given clue and line length.
 */
function generateLineCombinations(clue, lineLen) {
  if (clue.length === 1 && clue[0] === 0) {
    return [new Array(lineLen).fill(0)];
  }

  const results = [];
  const numBlocks = clue.length;
  const minLen = clue.reduce((a, b) => a + b, 0) + numBlocks - 1;

  function backtrack(blockIdx, pos, line) {
    if (blockIdx === numBlocks) {
      // Fill rest with 0
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
      // Fill gap before block with 0
      for (let i = pos; i < start; i++) newLine[i] = 0;
      // Fill block with 1
      for (let i = start; i < start + blockLen; i++) newLine[i] = 1;
      // Mandatory gap after block
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

/**
 * Line solving via constraint propagation.
 * Returns { solved, grid } where solved=true means unique solution found.
 * grid cells: -1=unknown, 0=empty, 1=filled
 */
function lineSolve(rowClues, colClues, size) {
  // Initialize grid to unknown
  const grid = Array.from({ length: size }, () => new Array(size).fill(-1));

  let changed = true;
  let iterations = 0;
  const MAX_ITER = 200;

  while (changed && iterations < MAX_ITER) {
    changed = false;
    iterations++;

    // Process rows
    for (let i = 0; i < size; i++) {
      const line = grid[i];
      const combos = generateLineCombinations(rowClues[i], size).filter(combo => {
        for (let j = 0; j < size; j++) {
          if (line[j] !== -1 && line[j] !== combo[j]) return false;
        }
        return true;
      });

      if (combos.length === 0) return { solved: false, grid, error: `Row ${i} has no valid combinations` };

      for (let j = 0; j < size; j++) {
        if (line[j] !== -1) continue;
        const allSame = combos.every(c => c[j] === combos[0][j]);
        if (allSame) {
          grid[i][j] = combos[0][j];
          changed = true;
        }
      }
    }

    // Process columns
    for (let j = 0; j < size; j++) {
      const line = [];
      for (let i = 0; i < size; i++) line.push(grid[i][j]);

      const combos = generateLineCombinations(colClues[j], size).filter(combo => {
        for (let i = 0; i < size; i++) {
          if (line[i] !== -1 && line[i] !== combo[i]) return false;
        }
        return true;
      });

      if (combos.length === 0) return { solved: false, grid, error: `Col ${j} has no valid combinations` };

      for (let i = 0; i < size; i++) {
        if (grid[i][j] !== -1) continue;
        const allSame = combos.every(c => c[i] === combos[0][i]);
        if (allSame) {
          grid[i][j] = combos[0][i];
          changed = true;
        }
      }
    }
  }

  const solved = grid.every(row => row.every(cell => cell !== -1));
  return { solved, grid, iterations };
}

// ── Main ──
console.log('=== 15x15 Puzzle Unique Solution Verification ===\n');

const puzzles15 = HANDMADE_PUZZLES['15x15'];
console.log(`Total 15x15 puzzles: ${puzzles15.length}\n`);

let passCount = 0;
let failCount = 0;
const failures = [];

for (let idx = 0; idx < puzzles15.length; idx++) {
  const p = puzzles15[idx];
  const { rowClues, colClues } = computeClues(p.solution);
  const size = p.solution.length;

  const result = lineSolve(rowClues, colClues, size);

  if (result.solved) {
    // Verify it matches original solution
    let matches = true;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (result.grid[i][j] !== p.solution[i][j]) {
          matches = false;
          break;
        }
      }
      if (!matches) break;
    }

    if (matches) {
      console.log(`  ✅ ${idx + 1}. ${p.name} — unique solution (${result.iterations} iterations)`);
      passCount++;
    } else {
      console.log(`  ❌ ${idx + 1}. ${p.name} — solved but doesn't match original!`);
      failCount++;
      failures.push({ idx: idx + 1, name: p.name, reason: 'solution mismatch' });
    }
  } else {
    if (result.error) {
      console.log(`  ❌ ${idx + 1}. ${p.name} — contradiction: ${result.error}`);
      failCount++;
      failures.push({ idx: idx + 1, name: p.name, reason: result.error });
    } else {
      // Count unknowns
      let unknowns = 0;
      result.grid.forEach(row => row.forEach(cell => { if (cell === -1) unknowns++; }));
      console.log(`  ⚠️  ${idx + 1}. ${p.name} — AMBIGUOUS (${unknowns} undetermined cells after ${result.iterations} iterations)`);
      failCount++;
      failures.push({ idx: idx + 1, name: p.name, reason: `ambiguous (${unknowns} unknowns)`, grid: result.grid });
    }
  }
}

console.log(`\n=== Results ===`);
console.log(`Passed: ${passCount}/${puzzles15.length}`);
console.log(`Failed: ${failCount}/${puzzles15.length}`);

if (failures.length > 0) {
  console.log('\nFailed puzzles:');
  failures.forEach(f => console.log(`  ${f.idx}. ${f.name}: ${f.reason}`));
}

// Also verify other sizes briefly
['5x5', '8x8', '10x10'].forEach(sizeKey => {
  const puzzles = HANDMADE_PUZZLES[sizeKey];
  if (!puzzles) return;
  console.log(`\n=== ${sizeKey} Quick Check (${puzzles.length} puzzles) ===`);
  let pass = 0, fail = 0;
  for (const p of puzzles) {
    const { rowClues, colClues } = computeClues(p.solution);
    const result = lineSolve(rowClues, colClues, p.solution.length);
    if (result.solved) pass++;
    else {
      fail++;
      let unknowns = 0;
      result.grid.forEach(row => row.forEach(cell => { if (cell === -1) unknowns++; }));
      console.log(`  ⚠️  ${p.name} — ambiguous (${unknowns} unknowns)`);
    }
  }
  console.log(`  ${pass}/${puzzles.length} uniquely solvable by line solving`);
});
