#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

/**
 * Generate warnings snapshot script
 *
 * This script runs tests with a special flag that causes the console
 * capture system to automatically generate/update the snapshot file.
 *
 * Usage:
 * yarn test:warnings:update:unit
 * yarn test:warnings:update:integration
 * yarn test:warnings:update:e2e
 */

import { runCommand } from './lib/run-command';

// Map snapshot type to test command
const TEST_COMMANDS: Record<string, string[]> = {
  unit: ['test:unit', '--passWithNoTests'],
  integration: ['test:integration', '--passWithNoTests'],
  e2e: ['test:e2e:chrome'],
};

async function runTestCommand(
  scriptArgs: string[],
  env: NodeJS.ProcessEnv,
): Promise<number> {
  try {
    // runCommand takes: command, args (with env merged into process.env)
    const originalEnv = process.env;
    process.env = { ...originalEnv, ...env };
    try {
      await runCommand('yarn', scriptArgs);
      return 0;
    } finally {
      process.env = originalEnv;
    }
  } catch (error: unknown) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      typeof error.code === 'number'
    ) {
      return error.code;
    }
    return 1;
  }
}

async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  // Get snapshot type from command line argument
  const snapshotType = process.argv[2] || 'unit';

  if (!['unit', 'integration', 'e2e'].includes(snapshotType)) {
    console.error(
      '❌ Invalid snapshot type. Must be: unit, integration, or e2e',
    );
    console.error(`   Received: ${snapshotType}`);
    console.error('\nUsage:');
    console.error('  yarn test:warnings:update:unit');
    console.error('  yarn test:warnings:update:integration');
    console.error('  yarn test:warnings:update:e2e');
    process.exit(1);
  }

  console.log(
    `Running ${snapshotType} tests to capture warnings and errors...\n`,
  );

  // Check if we have existing temp files
  const tempDir = path.join(
    process.cwd(),
    'test',
    `.warnings-snapshot-temp-${snapshotType}`,
  );
  const hasExistingTempFiles =
    fs.existsSync(tempDir) && fs.readdirSync(tempDir).length > 0;

  if (hasExistingTempFiles) {
    const tempFileCount = fs.readdirSync(tempDir).length;

    if (snapshotType === 'e2e') {
      // For e2e, count total test files to show progress
      const testDir = path.join(process.cwd(), 'test/e2e/tests');
      let totalTests = 0;

      const countTestFiles = (dir: string): void => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            countTestFiles(fullPath);
          } else if (entry.name.endsWith('.spec.ts') || entry.name.endsWith('.spec.js')) {
            totalTests++;
          }
        }
      };

      countTestFiles(testDir);
      const missingTests = totalTests - tempFileCount;

      console.log(`📂 Found ${tempFileCount} temp file(s) from previous run.`);
      console.log(`   Expecting ${totalTests} total to generate snapshot.`);
      if (missingTests > 0) {
        console.log(`   ${missingTests} temp file(s) still need to be generated.`);
      }
      console.log('   Re-running all tests...\n');
    } else {
      // For unit/integration, we use workers so can't predict exact temp file count
      console.log(
        `📂 Found ${tempFileCount} temp file(s) from previous run.`,
      );
      console.log('   Re-running tests to update temp files...\n');
    }
  }

  // Set environment variables for snapshot generation
  const env = {
    ...process.env,
    GENERATE_WARNINGS_SNAPSHOT: 'true',
    WARNINGS_SNAPSHOT_TYPE: snapshotType,
  };

  try {
    const testCommand = TEST_COMMANDS[snapshotType];
    if (!testCommand) {
      throw new Error(`No test command defined for type: ${snapshotType}`);
    }

    const exitCode = await runTestCommand(testCommand, env);

    if (exitCode !== 0) {
      console.error(
        '\n❌ Some tests failed. Snapshot cannot be generated yet.',
      );
      console.error(`   Exit code: ${exitCode}`);

      // Count temp files to show progress
      if (fs.existsSync(tempDir)) {
        const tempFileCount = fs.readdirSync(tempDir).length;
        console.log(
          `\n📊 Progress: ${tempFileCount} test(s) have saved their warnings/errors.`,
        );
      }

      console.log('\n🔄 To retry:');
      console.log('   1. Fix the failing test(s)');
      console.log('   2. Run this command again:');
      console.log(`      yarn test:warnings:update:${snapshotType}`);
      console.log('\n   Temp files are preserved. When all tests pass,');
      console.log('   the snapshot will be auto-generated! 🎯');
      process.exit(1);
    }

    // All tests passed - aggregate and save final snapshot
    console.log('\n✅ All tests passed! Aggregating and saving snapshot...');

    // Ensure WARNINGS_SNAPSHOT_TYPE is set in THIS process for aggregation
    process.env.WARNINGS_SNAPSHOT_TYPE = snapshotType;

    const { aggregateAndSaveSnapshot } = await import(
      '../test/helpers/console-snapshot.js'
    );
    aggregateAndSaveSnapshot();

    const typeLabel =
      snapshotType.charAt(0).toUpperCase() + snapshotType.slice(1);
    console.log(`\n✅ ${typeLabel} tests snapshot generation complete!`);
    console.log(`   Check test/test-warnings-snapshot-${snapshotType}.json`);
    console.log('\n🧹 All temporary files have been cleaned up.');
  } catch (error) {
    console.error('Error generating snapshot:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
