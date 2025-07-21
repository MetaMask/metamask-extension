#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { stderr } from 'node:process';
import chalk from 'chalk';
import madge, { type MadgeConfig, type MadgeInstance } from 'madge';
import micromatch from 'micromatch';
import prettier from 'prettier';

/**
 * Circular dependencies are represented as an array of arrays, where each
 * inner array represents a cycle of dependencies.
 */
type CircularDeps = string[][];

type MadgeRC = { allowedCircularGlob: string[] } & MadgeConfig;

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
  'You may be able to resolve this issue by running `yarn circular-deps:update` locally and commit the changes.';

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
  // TODO: eventually include development and test directories. We can't right
  // now because madge skips files, and we no longer allow skipped imports.
  // 'development/', // Development scripts and utilities
  // 'test/', // Tests
  'app/', // Main application code
  'offscreen/', // Offscreen page for MV3
  'shared/', // Shared utilities and components
  'ui/', // UI components and styles
];

// Common madge configuration
const { allowedCircularGlob, ...MADGE_CONFIG } = JSON.parse(
  readFileSync('.madgerc', 'utf-8'),
) as MadgeRC;

async function update(): Promise<void> {
  try {
    console.log('Generating dependency graph...');
    const tree = await madge(ENTRYPOINTS, MADGE_CONFIG);
    const circularDeps = normalizeJson(tree.circular());
    const prettierOptions = await prettier.resolveConfig(TARGET_FILE);
    const formatted = await prettier.format(
      FILE_HEADER + JSON.stringify(circularDeps, null, 2),
      {
        // get options from .prettierrc
        ...prettierOptions,
        filepath: TARGET_FILE,
      },
    );
    writeFileSync(TARGET_FILE, formatted);
    console.log(`Found ${circularDeps.length} circular dependencies.`);
    console.log(`Wrote circular dependencies to ${TARGET_FILE}`);
  } catch (error) {
    console.error(
      chalk.red('Error while updating circular dependencies: ', error),
    );
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
      console.error(chalk.red(`Error: ${TARGET_FILE} does not exist.`));
      console.error(RESOLUTION_STEPS);
      process.exit(1);
    }

    // Determine actual circular dependencies in the codebase
    const tree = await madge(ENTRYPOINTS, MADGE_CONFIG);
    const actualDeps = normalizeJson(tree.circular());

    // Read existing file and strip comments
    const fileContents = readFileSync(TARGET_FILE, 'utf-8');
    const baselineDeps = JSON.parse(stripJsonComments(fileContents));

    // Compare dependencies
    const actualStr = JSON.stringify(actualDeps);
    const baselineStr = JSON.stringify(baselineDeps);

    if (actualStr !== baselineStr) {
      console.error(
        chalk.red(
          `Error: Codebase circular dependencies are out of sync with ${TARGET_FILE}`,
        ),
      );
      console.error(RESOLUTION_STEPS);
      process.exit(1);
    }

    failIfDisallowedCircularDepsFound(tree);

    console.log(chalk.green.bold('Circular dependencies check passed.'));
  } catch (error) {
    console.error(
      chalk.red('Error while checking circular dependencies: ', error),
    );
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
    console.error(
      chalk.yellow.bold(`✖ ${skipped.length} skipped ${file} found:\n`),
    );
    skipped.forEach((module, index) => {
      console.error(chalk.dim(`${index + 1}) `) + chalk.cyan(module));
    });

    console.error(
      chalk.yellow.bold(
        "\nThis likely means there is a problem generating a dependency tree (like importing a file from a path that doesn't exist), or there is an invalid madge configuration.\n",
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
    console.error(
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
    console.error(
      chalk.bold(
        `\nNew circular dependencies issues were found in disallowed folders.`,
      ),
    );
    console.error(
      chalk.red.bold('You must remove these circular dependencies.'),
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
 * @returns true if any errors are found, otherwise false
 */
function maybeLogErrors(circular: CircularDeps, skipped: string[]): boolean {
  const logSkipped = maybeLogSkipped(skipped);
  const logCircular = maybeLogCircular(circular);

  return !(logSkipped || logCircular);
}

/**
 * Exits with a non-zero exit code if the provided `actualDeps` contain any
 * circular dependencies that are not allowed by the `allowedCircularGlob`, or
 * if a pattern in `allowedCircularGlob` do not match any deps in `actualDeps`.
 *
 * If a pattern in `allowedCircularGlob` is unused, the developer must remove or
 * update it (this is a good thing!).
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
  if (!maybeLogErrors(disallowedCycles, skipped)) {
    process.exit(1);
  }

  // 2) Ensure that each pattern in `allowedCircularGlob` actually matches at
  // least one dep in `actualDeps`. If a pattern is unused, we want the
  // developer to remove or update it.
  const unusedAllowedPatterns = allowedCircularGlob.filter(
    (pattern) =>
      !actualDeps.some((cycle) =>
        cycle.some((dep) => micromatch.isMatch(dep, pattern)),
      ),
  );

  if (unusedAllowedPatterns.length > 0) {
    console.error(
      chalk.magenta(
        `The following allowed circular dependency patterns do not match any files:\n`,
      ),
    );
    unusedAllowedPatterns.forEach((pattern, index) => {
      console.error(chalk.dim(`${index + 1}) `) + chalk.cyan(pattern));
    });

    console.error(chalk.magenta.bold('\n✨ This is a good thing! ✨\n'));
    console.error(
      chalk.italic(
        'You must remove or update unused patterns in the .madgerc file then commit the changes.\n',
      ),
    );
    process.exit(1);
  }
}

/**
 * Main function that implement the CLI interface.
 */
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
  console.error(chalk.red('Unexpected error: ', error));
  process.exit(1);
});
