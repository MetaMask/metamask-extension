#!/usr/bin/env -S node --require "./node_modules/tsx/dist/preflight.cjs" --import "./node_modules/tsx/dist/loader.mjs"

/**
 * Generate warnings snapshot script for unit tests
 *
 * This script runs unit tests with a special flag that causes the console
 * capture system to automatically generate/update the unit tests snapshot file.
 *
 * Usage: yarn test:warnings:update:unit
 */

import { spawn } from 'child_process';

async function runTestCommand(
  command: string[],
  env: NodeJS.ProcessEnv,
): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const proc = spawn('yarn', command, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env,
    });

    proc.on('close', (code: number | null) => {
      // Return exit code so we can check if tests passed
      resolve(code ?? 1);
    });

    proc.on('error', (error: Error) => {
      console.error(`Error running ${command.join(' ')}:`, error);
      reject(error);
    });
  });
}

async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  console.log('Running unit tests to capture warnings and errors...\n');

  // Check if we have existing temp files
  const tempDir = path.join(
    process.cwd(),
    'test',
    '.warnings-snapshot-temp-unit',
  );
  const hasExistingTempFiles =
    fs.existsSync(tempDir) && fs.readdirSync(tempDir).length > 0;

  if (hasExistingTempFiles) {
    const tempFiles = fs.readdirSync(tempDir);
    console.log(
      `📂 Found ${tempFiles.length} existing temp file(s) from previous run.`,
    );
    console.log('   These will be updated as tests run.\n');
  }

  console.log('Note: Snapshot will be auto-generated once ALL tests pass.\n');

  // Set environment variables for snapshot generation
  const env = {
    ...process.env,
    GENERATE_WARNINGS_SNAPSHOT: 'true',
    WARNINGS_SNAPSHOT_TYPE: 'unit',
  };

  try {
    const exitCode = await runTestCommand(
      ['test:unit', '--passWithNoTests'],
      env,
    );

    if (exitCode !== 0) {
      console.error(
        '\n❌ Some tests failed. Snapshot cannot be generated yet.',
      );
      console.error(`   Exit code: ${exitCode}`);

      // Count temp files to show progress
      if (fs.existsSync(tempDir)) {
        const tempFileCount = fs.readdirSync(tempDir).length;
        console.log(
          `\n📊 Progress: ${tempFileCount} worker(s) have saved their warnings/errors.`,
        );
      }

      console.log('\n🔄 To retry:');
      console.log('   1. Fix the failing test(s)');
      console.log('   2. Run this command again:');
      console.log('      yarn test:warnings:update:unit');
      console.log('\n   Temp files are preserved. When all tests pass,');
      console.log('   the snapshot will be auto-generated! 🎯');
      process.exit(1);
    }

    // All tests passed - aggregate and save final snapshot
    console.log('\n✅ All tests passed! Aggregating and saving snapshot...');

    // Ensure WARNINGS_SNAPSHOT_TYPE is set in THIS process for aggregation
    process.env.WARNINGS_SNAPSHOT_TYPE = 'unit';

    const { aggregateAndSaveSnapshot } = await import(
      '../test/helpers/console-snapshot'
    );
    aggregateAndSaveSnapshot();

    console.log('\n✅ Unit tests snapshot generation complete!');
    console.log('   Check test/test-warnings-snapshot-unit.json');
    console.log('\n🧹 All temporary files have been cleaned up.');
  } catch (error) {
    console.error('Error generating snapshot:', error);
    throw error;
  }
}

// Run if executed directly (via tsx)
main().catch((error: Error) => {
  console.error('Error generating snapshot:', error);
  process.exit(1);
});

export { main };
