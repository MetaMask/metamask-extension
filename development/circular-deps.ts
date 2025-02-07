#!/usr/bin/env tsx

import fs, { readFileSync } from 'fs';
import madge from 'madge';
import fg from 'fast-glob';

const TARGET_FILE = 'development/circular-deps.jsonc';

const FILE_HEADER = `// This is a machine-generated file that tracks circular dependencies in the codebase.
// To understand changes in this file:
// - Each array represents a cycle of imports where the last file imports the first
// - The cycles are sorted alphabetically for consistent diffs
// - To update this file, run: yarn circular-deps:update
// - To prevent new circular dependencies, ensure your changes don't add new cycles
// - For more information contact the Extension Platform team.

`;

/**
 * Message displayed when circular dependency checks fail and need resolution.
 */
const RESOLUTION_STEPS =
  'To resolve this issue, run `yarn circular-deps:update` locally and commit the changes.';

/**
 * Patterns for files and directories to ignore when checking for circular dependencies:
 * - test files and directories
 * - storybook files and directories
 * - any file with .test., .spec., or .stories. in its name
 */
const IGNORE_PATTERNS = [
  // Test files and directories
  '**/test/**',
  '**/tests/**',
  '**/*.test.*',
  '**/*.spec.*',

  // Storybook files and directories
  '**/stories/**',
  '**/storybook/**',
  '**/*.stories.*',
];

/**
 * Source code directories to check for circular dependencies.
 * These are the main app directories containing production code.
 */
const ENTRYPOINT_PATTERNS = [
  'app/**/*', // Main application code
  'shared/**/*', // Shared utilities and components
  'ui/**/*', // UI components and styles
];

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
 * Input cycle:  B -> C -> A -> B
 * Output cycle: A -> B -> C -> A
 *
 * The normalization allows for reliable diff comparisons by eliminating
 * ordering variations.
 *…
 *
 * @param cycles
 */
function normalizeJson(cycles: CircularDeps): CircularDeps {
  return cycles.map((cycle) => [...cycle].sort()).sort();
}

// Common madge configuration
const MADGE_CONFIG = JSON.parse(readFileSync('.madgerc', 'utf-8'));

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

async function update(): Promise<void> {
  try {
    console.log('Generating circular dependencies...');
    const circularDeps = await getMadgeCircularDeps();
    fs.writeFileSync(
      TARGET_FILE,
      `${FILE_HEADER + JSON.stringify(circularDeps, null, 2)}\n`,
    );
    console.log(`Wrote circular dependencies to ${TARGET_FILE}`);
  } catch (error) {
    console.error('Error while updating circular dependencies:', error);
    process.exit(1);
  }
}

/**
 * Simplified version of stripJsonComments that removes any line that
 * starts with // (ignoring whitespace).
 *
 * @param jsonc
 */
function stripJsonComments(jsonc: string): string {
  return jsonc
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n');
}

async function check(): Promise<void> {
  try {
    // Check if target file exists
    if (!fs.existsSync(TARGET_FILE)) {
      console.error(`Error: ${TARGET_FILE} does not exist.`);
      console.log(RESOLUTION_STEPS);
      process.exit(1);
    }

    // Determine actual circular dependencies in the codebase
    const actualDeps = await getMadgeCircularDeps();

    // Read existing file and strip comments
    const fileContents = fs.readFileSync(TARGET_FILE, 'utf-8');
    const baselineDeps = JSON.parse(stripJsonComments(fileContents));

    // Compare dependencies
    const actualStr = JSON.stringify(actualDeps);
    const baselineStr = JSON.stringify(baselineDeps);

    if (actualStr !== baselineStr) {
      console.error(
        `Error: Codebase circular dependencies are out of sync with ${TARGET_FILE}`,
      );
      console.log(RESOLUTION_STEPS);
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

  if (command !== 'check' && command !== 'update') {
    console.error('Usage: circular-deps.ts [check|update]');
    process.exit(1);
  }

  if (command === 'update') {
    await update();
  } else {
    await check();
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
