#!/usr/bin/env tsx

import fs from 'fs';
import madge from '@lgbot/madge';
import fg from 'fast-glob';

const TARGET_FILE = 'circular-deps.json';

// Files and patterns to ignore
const IGNORE_PATTERNS = [
  '**/test/**',
  '**/tests/**',
  '**/stories/**',
  '**/storybook/**',
  '**/*.test.*',
  '**/*.spec.*',
  '**/*.stories.*',
];

// Entry point patterns to check for circular dependencies
const ENTRYPOINT_PATTERNS = ['app/**/*', 'shared/**/*', 'ui/**/*'];

/**
 * Circular dependencies are represented as an array of arrays, where each
 * inner array represents a cycle of dependencies.
 */
type CircularDeps = string[][];

/**
 * Normalizes JSON output by sorting both the individual cycles and the array
 * of cycles. This ensures consistent output regardless of cycle starting point.
 *
 * Example:
 *   Input cycle:  B -> C -> A -> B
 *   Output cycle: A -> B -> C -> A
 *
 * The normalization allows for reliable diff comparisons by eliminating
 * ordering variations.
 *
 * @param cycles
 */
function normalizeJson(cycles: CircularDeps): CircularDeps {
  return cycles.map((cycle) => [...cycle].sort()).sort();
}

// Common madge configuration
const MADGE_CONFIG = {
  circular: true,
  extensions: ['js', 'jsx', 'ts', 'tsx'],
  excludeRegExp: IGNORE_PATTERNS.map(
    (pattern) =>
      new RegExp(pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*')),
  ),
  tsConfig: 'tsconfig.json',
  webpackConfig: 'webpack.config.js',
};

async function getMadgeCircularDeps(): Promise<CircularDeps> {
  console.log('Running madge to detect circular dependencies...');
  try {
    const entrypoints = (
      await Promise.all(
        ENTRYPOINT_PATTERNS.map((pattern) =>
          fg(pattern, { ignore: IGNORE_PATTERNS }),
        ),
      )
    ).flat();
    console.log(
      `Analyzing ${entrypoints.length} entry points for circular dependencies...`,
    );
    const result = await madge(entrypoints, MADGE_CONFIG);
    const circularDeps = result.circular();
    console.log(`Found ${circularDeps.length} circular dependencies`);
    return normalizeJson(circularDeps);
  } catch (error) {
    console.error('Error while running madge:', error);
    throw error;
  }
}

async function fix(): Promise<void> {
  try {
    console.log('Generating circular dependencies...');
    const circularDeps = await getMadgeCircularDeps();
    fs.writeFileSync(TARGET_FILE, JSON.stringify(circularDeps, null, 2));
    console.log(`Wrote circular dependencies to ${TARGET_FILE}`);
  } catch (error) {
    console.error('Error while fixing circular dependencies:', error);
    process.exit(1);
  }
}

async function check(): Promise<void> {
  const resolutionSteps =
    'To resolve this issue, run `yarn circular-deps:fix` locally and commit the changes.';

  try {
    // Check if target file exists
    if (!fs.existsSync(TARGET_FILE)) {
      console.error(`Error: ${TARGET_FILE} does not exist.`);
      console.log(resolutionSteps);
      process.exit(1);
    }

    // Get current circular dependencies
    const currentDeps = await getMadgeCircularDeps();

    // Read existing file
    const existingDeps = JSON.parse(fs.readFileSync(TARGET_FILE, 'utf-8'));

    // Compare dependencies
    const currentStr = JSON.stringify(currentDeps);
    const existingStr = JSON.stringify(existingDeps);

    if (currentStr !== existingStr) {
      console.error(
        `Error: Codebase circular dependencies are out of sync in ${TARGET_FILE}`,
      );
      console.log(resolutionSteps);
      process.exit(1);
    }

    console.log('Circular dependencies check passed.');
  } catch (error) {
    console.error('Error while checking circular dependencies:', error);
    process.exit(1);
  }
}

// Main execution
async function main(): Promise<void> {
  const command = process.argv[2];

  if (command !== 'check' && command !== 'fix') {
    console.error('Usage: circular-deps.ts [check|fix]');
    process.exit(1);
  }

  if (command === 'fix') {
    await fix();
  } else {
    await check();
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
