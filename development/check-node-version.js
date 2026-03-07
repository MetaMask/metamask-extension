#!/usr/bin/env node

/**
 * Simple helper to compare the current Node.js version with the one
 * specified in `.nvmrc`.
 *
 * Usage:
 *   node development/check-node-version.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const NVMRC_PATH = path.join(ROOT_DIR, '.nvmrc');

function main() {
  if (!fs.existsSync(NVMRC_PATH)) {
    console.log('.nvmrc not found in project root.');
    process.exit(0);
  }

  const expected = fs.readFileSync(NVMRC_PATH, 'utf8').trim();
  const current = process.version;

  console.log(`Expected Node version (from .nvmrc): ${expected}`);
  console.log(`Current Node version: ${current}`);

  if (current === expected) {
    console.log('✅ Node version matches .nvmrc.');
  } else {
    console.log('⚠️  Node version differs from .nvmrc. Consider running `nvm use`.');
  }
}

main();
