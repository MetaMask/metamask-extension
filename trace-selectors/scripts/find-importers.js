#!/usr/bin/env node
/**
 * Finds all non-test files that import from a given module path.
 * Used for building Layer 2, 3, ... in selector usage tracing.
 *
 * Usage: node find-importers.js <module-path> [search-root] [--with-symbols] [--symbols sym1,sym2] [--barrel]
 *   module-path: e.g. "selectors/assets" or "selectors" (no .ts/.js)
 *   search-root: optional, e.g. "ui" to limit search (default: repo root)
 *   --with-symbols: output "path\tsymbol1,symbol2" per file
 *   --symbols sym1,sym2: only list files that import at least one of these symbols (implies symbol parsing)
 *   --barrel: treat module-path as a barrel (match path equals segment or ends with /segment; do not match subpaths like selectors/foo)
 *   If module-path has no '/', barrel mode is inferred.
 * Output: One file path per line (relative to cwd). Optional: --with-symbols for "path\tsymbol1,symbol2"
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rawArgs = process.argv.slice(2);
const symbolFilterIdx = rawArgs.indexOf('--symbols');
const barrelIdx = rawArgs.indexOf('--barrel');
let allowedSymbols = null;
if (symbolFilterIdx !== -1 && rawArgs[symbolFilterIdx + 1]) {
  allowedSymbols = new Set(
    rawArgs[symbolFilterIdx + 1].split(',').map((s) => s.trim()).filter(Boolean),
  );
}
const args = rawArgs.filter((a, i) => {
  if (a === '--with-symbols' || a === '--barrel') return false;
  if (symbolFilterIdx >= 0 && (i === symbolFilterIdx || i === symbolFilterIdx + 1)) return false;
  return true;
});
const modulePath = args[0];
const searchRoot = args[1] || '.';
const withSymbols = process.argv.includes('--with-symbols') || allowedSymbols != null;
const barrelMode = barrelIdx !== -1 || (modulePath && !modulePath.includes('/'));

if (!modulePath) {
  process.stderr.write(
    'Usage: node find-importers.js <module-path> [search-root] [--with-symbols] [--barrel]\n',
  );
  process.exit(1);
}

// Normalize: we search for import paths that contain this (e.g. selectors/assets)
const pathFragment = modulePath.replace(/\.(ts|tsx|js|jsx)$/, '');
const escaped = pathFragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const rootAbs = path.resolve(process.cwd(), searchRoot);

// Barrel mode: match import path exactly equal to segment or ending with /segment (e.g. selectors or ../../selectors), not selectors/foo
const pattern = barrelMode
  ? `from\\s+['"](?:${escaped}|[^'"]*\\/${escaped})['"]`
  : `from\\s+['"]([^'"]*${escaped})['"]`;

const rgArgs = [
  '-l',
  '--glob=!*.test.*',
  '--glob=!*.spec.*',
  '--glob=!*.stories.*',
  pattern,
  rootAbs,
];

const result = spawnSync('rg', rgArgs, {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});

let out = result.stdout || '';
if (result.status !== 0 && result.status !== 1) {
  process.stderr.write((result.stderr || '') + '\n');
  process.exit(result.status == null ? 1 : result.status);
}

function normalizePaths(lines, rootAbsPath) {
  return lines
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((f) => {
      const full = path.isAbsolute(f) ? f : path.join(rootAbsPath, f);
      return path.relative(process.cwd(), full);
    })
    .filter((f) => !f.includes('__tests__') && !f.includes('__snapshots__'));
}

let files = normalizePaths(out, rootAbs);

// In barrel mode, keep only code files (exclude README/docs) so the trace stays tractable
if (barrelMode) {
  files = files.filter(
    (f) =>
      !/README\.(md|mdx)$/i.test(f) &&
      !/\.mdx$/i.test(f),
  );
}

// Same-directory imports: e.g. selectors.js has from './multichain' for selectors/multichain (not in barrel mode)
if (!barrelMode && pathFragment.includes('/')) {
  const basename = pathFragment.replace(/^.*\//, '');
  const sameDirPattern = `from\\s+['"]\\./${basename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`;
  const sameDirResult = spawnSync('rg', [
    '-l',
    '--glob=!*.test.*',
    '--glob=!*.spec.*',
    '--glob=!*.stories.*',
    sameDirPattern,
    rootAbs,
  ], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
  if (sameDirResult.status === 0 || sameDirResult.status === 1) {
    const sameDirFiles = normalizePaths(sameDirResult.stdout || '', rootAbs);
    files = [...new Set([...files, ...sameDirFiles])];
  }
}

const seen = new Set();
const uniq = files.filter((f) => {
  if (seen.has(f)) return false;
  seen.add(f);
  return true;
});

if (!withSymbols) {
  uniq.forEach((f) => process.stdout.write(f + '\n'));
  process.exit(0);
}

// With symbols: for each file, grep the import line and parse symbols
const pathBasename = pathFragment.includes('/') ? pathFragment.replace(/^.*\//, '') : null;
const escapedBasename = pathBasename ? pathBasename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : null;
// Barrel: match path exactly "segment" or ending with "/segment". Direct: match path containing pathFragment or ./basename
const fromPathReFragment = barrelMode
  ? `(?:[^'"]*\\/)?${escaped}`
  : `(?:[^'"]*${escaped}|\\./${escapedBasename || escaped})`;

function getImportedSymbols(file) {
  const abs = path.resolve(process.cwd(), file);
  const content = fs.readFileSync(abs, 'utf8');
  const symbols = [];
  const braceRe = new RegExp(
    `import\\s*\\{([^}]+)\\}\\s*from\\s+['"]${fromPathReFragment}['"]`,
    'g',
  );
  const starRe = new RegExp(
    `import\\s*\\*\\s+as\\s+(\\w+)\\s+from\\s+['"]${fromPathReFragment}['"]`,
    'g',
  );
  const defaultRe = new RegExp(
    `import\\s+(\\w+)\\s+from\\s+['"]${fromPathReFragment}['"]`,
    'g',
  );
  let m;
  while ((m = braceRe.exec(content)) !== null) {
    m[1].split(',').forEach((part) => {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) symbols.push(name);
    });
  }
  while ((m = starRe.exec(content)) !== null) {
    symbols.push('* as ' + m[1]);
  }
  while ((m = defaultRe.exec(content)) !== null) {
    symbols.push(m[1]);
  }
  return [...new Set(symbols)];
}

uniq.forEach((file) => {
  const symbols = getImportedSymbols(file);
  const symStr = symbols.join(', ') || '(default or *)';
  if (allowedSymbols != null) {
    const hasAllowed =
      symbols.some((s) => allowedSymbols.has(s)) ||
      symbols.some((s) => s.startsWith('* as ')) ||
      symStr === '(default or *)';
    if (!hasAllowed) return;
  }
  process.stdout.write(`${file}\t${symStr}\n`);
});
