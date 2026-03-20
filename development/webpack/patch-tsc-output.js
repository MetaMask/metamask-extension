#!/usr/bin/env node
/**
 * Post-tsc patch for LavaMoat compatibility.
 *
 * The reactCompilerLoaderWrapper uses `import.meta.url` which works when
 * tsx loads the .ts source as ESM (thread-loader workers), but fails in
 * LavaMoat's SES compartments (SyntaxError at parse time). This script
 * replaces it with `__filename` in the compiled CJS output.
 */
const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

const target = join(
  __dirname,
  '..',
  '.webpack',
  'utils',
  'loaders',
  'reactCompilerLoaderWrapper.js',
);

const content = readFileSync(target, 'utf8');
const patched = content.replace(/import\.meta\.url/gu, '__filename');

if (content !== patched) {
  writeFileSync(target, patched);
}
