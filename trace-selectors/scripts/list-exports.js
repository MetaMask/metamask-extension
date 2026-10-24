#!/usr/bin/env node
/**
 * Lists exported selector/function symbols from a TypeScript/JavaScript file.
 * Used as Layer 1 for selector usage tracing. Omits type-only exports.
 * `export { local as publicName }` is reported as publicName.
 *
 * Usage: node list-exports.js <path-to-file>
 * Output: One symbol per line (const/function/class/value exports only).
 */

const fs = require('fs');
const path = require('path');

function exportedName(part) {
  const trimmed = part.trim();
  if (trimmed === '' || trimmed.startsWith('type ')) return null;
  const alias = trimmed.match(/^(\w+)\s+as\s+(\w+)$/);
  if (alias) return alias[2];
  const name = trimmed.split(/\s+/)[0];
  return /^\w+$/.test(name) ? name : null;
}

function listExports(content) {
  const symbols = [];

  const constExport = /^\s*export\s+const\s+(\w+)\s*[=:(]/gm;
  let match;
  while ((match = constExport.exec(content)) !== null) {
    symbols.push(match[1]);
  }

  const funcExport = /^\s*export\s+function\s+(\w+)\s*\(/gm;
  while ((match = funcExport.exec(content)) !== null) {
    symbols.push(match[1]);
  }

  const classExport = /^\s*export\s+class\s+(\w+)\s*[\s{]/gm;
  while ((match = classExport.exec(content)) !== null) {
    symbols.push(match[1]);
  }

  const namedExport = /^\s*export\s*\{([^}]+)\}/gm;
  while ((match = namedExport.exec(content)) !== null) {
    for (const part of match[1].split(',')) {
      const name = exportedName(part);
      if (name) symbols.push(name);
    }
  }

  return [...new Set(symbols)].sort((a, b) => a.localeCompare(b, 'en'));
}

function listExportsFromFile(filePath) {
  const absPath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
    const error = new Error(`File not found: ${absPath}`);
    error.code = 'ENOENT';
    throw error;
  }
  return listExports(fs.readFileSync(absPath, 'utf8'));
}

if (require.main === module) {
  const filePath = process.argv[2];
  if (!filePath) {
    process.stderr.write('Usage: node list-exports.js <path-to-file>\n');
    process.exit(1);
  }
  try {
    listExportsFromFile(filePath).forEach((symbol) => {
      process.stdout.write(`${symbol}\n`);
    });
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  listExports,
  listExportsFromFile,
};
