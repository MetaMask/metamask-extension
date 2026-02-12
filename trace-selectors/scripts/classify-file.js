#!/usr/bin/env node
/**
 * Classifies file paths as type (selector | duck | hook | component | util | other)
 * and whether they are terminal (React component or React hook).
 * Used during selector usage tracing to decide whether to recurse.
 *
 * Usage: node classify-file.js <path> [path ...]
 *   Or:  cat paths.txt | node classify-file.js
 * Output: path\ttype\tterminal (one line per path)
 */

const fs = require('fs');
const path = require('path');

function classify(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const base = path.basename(normalized);
  const lower = normalized.toLowerCase();

  // Terminal: React hook (path in ui/hooks/ or filename use*.ts(x))
  if (lower.includes('/hooks/') || /^use[a-z].*\.(tsx?|jsx?)$/i.test(base)) {
    return { type: 'hook', terminal: true };
  }

  // Terminal: React component (ui/components/ or ui/pages/ with .tsx/.jsx/.js)
  if (
    (lower.includes('/components/') || lower.includes('/pages/')) &&
    /\.(tsx|jsx|js)$/.test(normalized)
  ) {
    return { type: 'component', terminal: true };
  }

  // Selector: under ui/selectors/ and typically exports createSelector
  if (lower.includes('/selectors/')) {
    return { type: 'selector', terminal: false };
  }

  // Duck: Redux under ui/ducks/
  if (lower.includes('/ducks/')) {
    return { type: 'duck', terminal: false };
  }

  // Util: helpers (e.g. ui/helpers/, shared/lib/)
  if (
    lower.includes('/helpers/') ||
    lower.includes('/lib/') ||
    lower.includes('/util') ||
    base === 'utils.ts' ||
    base === 'utils.js'
  ) {
    return { type: 'util', terminal: false };
  }

  // Default: other (could be page logic, etc.) - treat as non-terminal so we recurse
  return { type: 'other', terminal: false };
}

const inputs = process.argv.slice(2);
let paths;

if (inputs.length > 0) {
  paths = inputs;
} else {
  const stdin = fs.readFileSync(0, 'utf8');
  paths = stdin
    .trim()
    .split('\n')
    .map((p) => p.trim())
    .filter(Boolean);
}

paths.forEach((p) => {
  const { type, terminal } = classify(p);
  process.stdout.write(`${p}\t${type}\t${terminal}\n`);
});
