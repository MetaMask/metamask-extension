#!/usr/bin/env node

/**
 * Simple helper to sanity-check the local `.metamaskrc` configuration.
 *
 * This script:
 * - warns if `.metamaskrc` is missing;
 * - shows which keys from `.metamaskrc.dist` are set in `.metamaskrc`;
 * - highlights obviously placeholder values.
 *
 * Usage:
 *   node development/check-metamaskrc.js
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = process.cwd();
const DIST_PATH = path.join(ROOT_DIR, '.metamaskrc.dist');
const LOCAL_PATH = path.join(ROOT_DIR, '.metamaskrc');

function readFileIfExists(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, 'utf8');
}

function parseKeyValueLines(content) {
  const result = {};
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [key, ...rest] = trimmed.split('=');
    const value = rest.join('=').trim();

    if (key) {
      result[key.trim()] = value;
    }
  }

  return result;
}

function isPlaceholder(value) {
  if (!value) {
    return true;
  }

  const lower = value.toLowerCase();
  return (
    lower.includes('your_') ||
    lower.includes('changeme') ||
    lower.includes('example') ||
    lower === 'todo'
  );
}

function main() {
  console.log('🔎 Checking .metamaskrc configuration\n');

  const distContent = readFileIfExists(DIST_PATH);
  if (!distContent) {
    console.warn('⚠️  .metamaskrc.dist not found in project root.');
  }

  const localContent = readFileIfExists(LOCAL_PATH);
  if (!localContent) {
    console.warn('⚠️  .metamaskrc not found in project root.');
    console.warn('    You can create it by copying the dist file:');
    console.warn('    cp .metamaskrc{.dist,}');
    return;
  }

  const distConfig = distContent ? parseKeyValueLines(distContent) : {};
  const localConfig = parseKeyValueLines(localContent);

  const keysToCheck = [
    'INFURA_PROJECT_ID',
    'SEGMENT_WRITE_KEY',
    'SENTRY_DSN',
    'PASSWORD',
  ];

  console.log('Configuration status:\n');

  for (const key of keysToCheck) {
    const distHasKey = Object.prototype.hasOwnProperty.call(distConfig, key);
    const localValue = localConfig[key];

    if (!distHasKey && localValue === undefined) {
      // Key not in dist and not in local, skip silently
      continue;
    }

    if (localValue === undefined) {
      console.log(`- ${key}: not set in .metamaskrc`);
      continue;
    }

    const placeholder = isPlaceholder(localValue);

    if (placeholder) {
      console.log(`- ${key}: set, but looks like a placeholder value`);
    } else {
      console.log(`- ${key}: set`);
    }
  }

  console.log('\nNotes:');
  console.log('- INFURA_PROJECT_ID must be a valid Infura API key for network access.');
  console.log('- PASSWORD is optional but useful for development builds.');
  console.log('- SEGMENT_WRITE_KEY and SENTRY_DSN are only needed for specific debugging flows.\n');

  console.log('✅ Check finished. Adjust your .metamaskrc values if needed.');
}

main();
