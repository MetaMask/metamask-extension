#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { stderr } from 'node:process';
import chalk from 'chalk';
import madge, { type MadgeConfig, type MadgeInstance } from 'madge';
import micromatch from 'micromatch';

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

/**
 * Source code directories to check for circular dependencies.
 * These are the main app directories containing production/development code.
 */
const ENTRYPOINTS = [
  'app/', // Main application code
  // 'development/', // Development scripts and utilities
  'offscreen/', // Offscreen page for MV3
  'shared/', // Shared utilities and components
  // 'test/', // Tests
  'ui/', // UI components and styles
];

// Common madge configuration
const { allowedCircularGlob, ...MADGE_CONFIG } = JSON.parse(
  readFileSync('.madgerc', 'utf-8'),
) as { allowedCircularGlob: string[] } & madge.MadgeConfig;

async function getTree(
  entrypoints: string[],
  config: MadgeConfig,
): Promise<MadgeInstance> {
  console.log('Running madge to detect circular dependencies...');
  console.log(
    `Analyzing ${entrypoints.length} entry points for circular dependencies...`,
  );

  return await madge(entrypoints, config);
}

async function update(): Promise<void> {
  try {
    console.log('Generating circular dependencies...');
    const tree = await getTree(ENTRYPOINTS, MADGE_CONFIG);
    const circularDeps = normalizeJson(tree.circular());
    writeFileSync(
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
    if (!existsSync(TARGET_FILE)) {
      console.error(`Error: ${TARGET_FILE} does not exist.`);
      console.log(RESOLUTION_STEPS);
      process.exit(1);
    }

    // Determine actual circular dependencies in the codebase
    const tree = await getTree(ENTRYPOINTS, MADGE_CONFIG);
    const actualDeps = normalizeJson(tree.circular());

    // Read existing file and strip comments
    const fileContents = readFileSync(TARGET_FILE, 'utf-8');
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

    failIfDisallowedCircularDepsFound(tree);

    console.log('Circular dependencies check passed.');
  } catch (error) {
    console.error('Error while checking circular dependencies:', error);
    process.exit(1);
  }
}

/**
 * Logs skipped files and returns `true` if any are found, otherwise `false`.
 *
 * @param skipped
 * @returns
 */
function maybeLogSkipped(skipped: string[]): boolean {
  if (skipped.length) {
    const file = `file${skipped.length === 1 ? '' : 's'}`;
    console.error(chalk.yellow.bold(`✖ Skipped ${file} found:`));
    skipped.forEach((module) => {
      console.error(chalk.yellow(module));
    });
    console.error('\n');

    console.error(
      chalk.yellow.bold(
        "This likely means there is a problem generating a dependency tree (like importing a file from a path that doesn't exist), or there is an invalid build configuration.\n",
      ),
    );
    return true;
  }
  return false;
}

/**
 * Logs circular dependencies and returns `true` if any are found, otherwise `false`.
 *
 * @param circular
 * @returns
 */
function maybeLogCircular(circular: CircularDeps): boolean {
  if (circular.length) {
    const dependency = `dependenc${circular.length === 1 ? 'y' : 'ies'}`;
    stderr.write(
      chalk.red.bold(`Found ${circular.length} circular ${dependency}\n`),
    );

    circular.forEach((path, index) => {
      stderr.write(chalk.dim(`${index + 1}) `));
      path.forEach((module, number) => {
        if (number !== 0) {
          stderr.write(chalk.dim(' > '));
        }
        stderr.write(chalk.cyan.bold(module));
      });
      stderr.write('\n');
    });

    stderr.write(
      chalk.red.bold('You must remove these circular dependencies.\n'),
    );
    return true;
  }
  return false;
}

/**
 * Logs errors if any are found.
 *
 * @param circular
 * @param skipped
 * @returns boolean
 */
function maybeLogErrors(circular: CircularDeps, skipped: string[]): boolean {
  const logSkipped = maybeLogSkipped(skipped);
  const logCircular = maybeLogCircular(circular);

  return !(logSkipped || logCircular);
}

/**
 * Exits with a non-zero exit code if the provided `actualDeps` contain any
 * circular dependencies that are not allowed by the `allowedCircularGlob`.
 *
 * @param tree
 */
function failIfDisallowedCircularDepsFound(tree: MadgeInstance): void {
  const actualDeps = tree.circular();

  // 1) Find all cycles containing any dep that does NOT match the allowed patterns.
  const disallowedCycles = actualDeps.filter((cycle) =>
    cycle.some((dep) => !micromatch.some(dep, allowedCircularGlob)),
  );

  const { skipped } = tree.warnings();
  if (maybeLogErrors(disallowedCycles, skipped)) {
    console.error(
      `Error: New circular dependencies found in disallowed folders`,
    );
    console.log('You must remove these circular dependencies.');
    process.exit(1);
  }

  // 2) Ensure that each pattern in `allowedCircularGlob` actually matches at least one dep in `actualDeps`.
  //    If a pattern is unused, we want the developer to remove or update it.
  const unusedAllowedPatterns = allowedCircularGlob.filter(
    (pattern) =>
      !actualDeps.some((cycle) =>
        cycle.some((dep) => micromatch.isMatch(dep, pattern)),
      ),
  );

  if (unusedAllowedPatterns.length > 0) {
    console.error(
      `Error: The following allowed circular dependency patterns do not match any files:\n\n${unusedAllowedPatterns.join(
        '\n',
      )}`,
    );
    console.log(
      'You must remove or update these unused patterns in your `.madgerc` file.',
    );
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
