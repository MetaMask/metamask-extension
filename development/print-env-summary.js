#!/usr/bin/env node

/**
 * Prints a short summary of key environment variables that affect
 * MetaMask extension builds.
 *
 * Usage:
 *   node development/print-env-summary.js
 */

const IMPORTANT_VARS = [
  'INFURA_PROJECT_ID',
  'SEGMENT_WRITE_KEY',
  'SENTRY_DSN',
  'PASSWORD',
];

function main() {
  console.log('MetaMask environment summary:\n');

  IMPORTANT_VARS.forEach((name) => {
    const value = process.env[name];
    if (!value) {
      console.log(`- ${name}: not set`);
    } else {
      console.log(`- ${name}: set (${value.slice(0, 4)}... hidden)`);
    }
  });

  console.log('\nNote: secrets should be kept in `.metamaskrc` or your shell,');
  console.log('not committed to the repository.');
}

main();
