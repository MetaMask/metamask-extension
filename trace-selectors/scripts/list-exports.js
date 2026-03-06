#!/usr/bin/env node
/**
 * Lists exported selector/function symbols from a TypeScript/JavaScript file.
 * Used as Layer 1 for selector usage tracing. Omits type-only exports.
 *
 * Usage: node list-exports.js <path-to-file>
 * Output: One symbol per line (const/function/class exports only).
 */

const fs = require('fs');
const path = require('path');

const filePath = process.argv[2];
if (!filePath) {
  process.stderr.write('Usage: node list-exports.js <path-to-file>\n');
  process.exit(1);
}

const absPath = path.isAbsolute(filePath)
  ? filePath
  : path.resolve(process.cwd(), filePath);

if (!fs.existsSync(absPath)) {
  process.stderr.write(`File not found: ${absPath}\n`);
  process.exit(1);
}

const content = fs.readFileSync(absPath, 'utf8');
const symbols = [];

// export const name = ...
// export const name = createSelector(...
const constExport = /^\s*export\s+const\s+(\w+)\s*[=:(]/gm;
let m;
while ((m = constExport.exec(content)) !== null) {
  symbols.push(m[1]);
}

// export function name(...
const funcExport = /^\s*export\s+function\s+(\w+)\s*\(/gm;
while ((m = funcExport.exec(content)) !== null) {
  symbols.push(m[1]);
}

// export class Name ...
const classExport = /^\s*export\s+class\s+(\w+)\s*[\s{]/gm;
while ((m = classExport.exec(content)) !== null) {
  symbols.push(m[1]);
}

// export { a, b, c } or export { a as b, c }
const namedExport = /^\s*export\s*\{([^}]+)\}/gm;
while ((m = namedExport.exec(content)) !== null) {
  const inner = m[1];
  const names = inner.split(',').map((part) => {
    const trimmed = part.trim();
    const asMatch = trimmed.match(/^(\w+)\s+as\s+\w+$/);
    return asMatch ? asMatch[1] : trimmed.split(/\s+/)[0];
  });
  names.forEach((name) => {
    if (name && /^\w+$/.test(name)) symbols.push(name);
  });
}

// Deduplicate and sort
const unique = [...new Set(symbols)].sort();

unique.forEach((s) => process.stdout.write(s + '\n'));
