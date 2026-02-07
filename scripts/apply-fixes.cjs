/**
 * Apply puzzle fixes to puzzleData.js
 * Reads the fixes from /tmp/puzzle_fixes.json and patches the source file.
 */
const fs = require('fs');
const path = require('path');

const fixes = JSON.parse(fs.readFileSync('/tmp/puzzle_fixes.json', 'utf8'));
let source = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'puzzleData.js'), 'utf8');

const src2 = source.replace('export const', 'const') + '\nmodule.exports = HANDMADE_PUZZLES;';
fs.writeFileSync('/tmp/pdata_apply.cjs', src2);
const HANDMADE_PUZZLES = require('/tmp/pdata_apply.cjs');

let totalFixed = 0;

for (const [sizeKey, puzzleFixes] of Object.entries(fixes)) {
  const puzzles = HANDMADE_PUZZLES[sizeKey];
  
  for (const [idxStr, fix] of Object.entries(puzzleFixes)) {
    const idx = parseInt(idxStr);
    const p = puzzles[idx];
    const oldSolution = p.solution;
    const newSolution = fix.solution;
    
    // Build with 8-space indent (matching actual file format)
    const oldLines = oldSolution.map(row => '        [' + row.join(',') + ']');
    const oldText = oldLines.join(',\n');
    
    const newLines = newSolution.map(row => '        [' + row.join(',') + ']');
    const newText = newLines.join(',\n');
    
    if (source.includes(oldText)) {
      source = source.replace(oldText, newText);
      console.log(`✅ Patched ${sizeKey} #${idx + 1} "${fix.name}"`);
      totalFixed++;
    } else {
      console.log(`❌ Could not find: ${sizeKey} #${idx + 1} "${fix.name}"`);
      // Show first line for debugging
      console.log(`  Expected: ${oldLines[0]}`);
      // Search for the name and nearby text
      const nameIdx = source.indexOf("name: '" + fix.name + "'");
      if (nameIdx >= 0) {
        console.log(`  Name found at char ${nameIdx}`);
        const snippet = source.substring(nameIdx, nameIdx + 200);
        console.log(`  Snippet: ${snippet.substring(0, 100)}`);
      }
    }
  }
}

fs.writeFileSync(path.join(__dirname, '..', 'src', 'lib', 'puzzleData.js'), source);
console.log(`\nTotal patched: ${totalFixed}`);
