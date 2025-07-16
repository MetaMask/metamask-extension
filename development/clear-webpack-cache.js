#!/usr/bin/env node

const fs = require('node:fs/promises');
const path = require('node:path');

const WEBPACK_CACHE_DIRECTORY = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '.cache',
  'webpack',
);

/**
 * Clear the Webpack cache.
 *
 * This is typically run in the `postinstall` npm/Yarn lifecycle script.
 */
async function main() {
  await fs.rm(WEBPACK_CACHE_DIRECTORY, { force: true, recursive: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
