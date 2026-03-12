#!/usr/bin/env node
/**
 * Lists UI selector files that import from @metamask/assets-controllers.
 * Use the output to build a config or pass roots to trace-usage.js.
 *
 * Usage: node discover-assets-controllers-roots.js [search-root]
 *   search-root: optional, default "ui/selectors"
 * Output: One file path per line (relative to cwd). Excludes test/spec/stories.
 */

const { spawnSync } = require('child_process');
const path = require('path');

const searchRoot = process.argv[2] || 'ui/selectors';
const rootAbs = path.resolve(process.cwd(), searchRoot);

const rgArgs = [
  '-l',
  '--glob=!*.test.*',
  '--glob=!*.spec.*',
  '--glob=!*.stories.*',
  'from\\s+[\'"]([^\'"]*@metamask/assets-controllers)[\'"]',
  rootAbs,
];

const result = spawnSync('rg', rgArgs, {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});

if (result.status !== 0 && result.status !== 1) {
  process.stderr.write((result.stderr || '') + '\n');
  process.exit(result.status == null ? 1 : result.status);
}

const out = (result.stdout || '').trim();
const files = out
  .split('\n')
  .filter(Boolean)
  .map((f) => {
    const normalized = f.trim();
    if (path.isAbsolute(normalized)) {
      return path.relative(process.cwd(), normalized);
    }
    if (normalized.startsWith('ui/')) {
      return normalized;
    }
    return path.join(searchRoot, normalized).replace(/\\/g, '/');
  })
  .filter((f) => !f.includes('__tests__') && !f.includes('__snapshots__'));

const seen = new Set();
files.forEach((f) => {
  if (seen.has(f)) return;
  seen.add(f);
  process.stdout.write(f + '\n');
});
