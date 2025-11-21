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

import { runCommand, runInShell } from './lib/run-command';

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

async function getE2eTestPaths(): Promise<string[]> {
  const fs = await import('fs');
  const path = await import('path');

  const testDir = path.join(process.cwd(), 'test/e2e/tests');
  const testPaths: string[] = [];

  const collectTestFiles = (dir: string): void => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectTestFiles(fullPath);
      } else if (
        entry.name.endsWith('.spec.ts') ||
        entry.name.endsWith('.spec.js')
      ) {
        testPaths.push(fullPath);
      }
    }
  };

  collectTestFiles(testDir);
  return testPaths;
}

async function checkAllE2eTestsHaveTempFiles(
  tempDirPath: string,
): Promise<boolean> {
  const fs = await import('fs');
  const path = await import('path');

  const testPaths = await getE2eTestPaths();
  const existingTempFiles = fs.readdirSync(tempDirPath);
  const completedTests = new Set();

  // Build set of completed test names from temp files
  for (const tempFile of existingTempFiles) {
    const match = tempFile.match(/warnings-e2e-test-(.+)\.json$/u);
    if (match) {
      completedTests.add(match[1]);
    }
  }

  // Check if all test files have corresponding temp files
  for (const testPath of testPaths) {
    const basename = path.basename(testPath);
    const testName = basename.replace(/\.(spec|test)\.(ts|js)$/iu, '');
    const sanitizedTestName = testName
      .replace(/[^a-z0-9]+/giu, '-')
      .replace(/^-|-$/gu, '');

    if (!completedTests.has(sanitizedTestName)) {
      return false; // Found a test without a temp file
    }
  }

  return true; // All tests have temp files
}

async function main(): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  // Get snapshot type and optional test file path from command line arguments
  const snapshotType = process.argv[2]; // mandatory: 'unit', 'integration', or 'e2e'
  const specificTestFile = process.argv[3]; // Optional: path to specific test file

  if (!['unit', 'integration', 'e2e'].includes(snapshotType)) {
    console.error(
      `❌ Invalid snapshot type (received: ${snapshotType}). Must be: unit, integration, or e2e`,
    );
    process.exit(1);
  }

  if (specificTestFile) {
    // Validate that the test file exists
    if (!fs.existsSync(specificTestFile)) {
      console.error(
        `\n❌ Test file not found: ${specificTestFile}. Please provide a valid path to a test file.`,
      );
      process.exit(1);
    }
    console.log(
      `Running specific ${snapshotType} test to capture warnings and errors for test file: ${specificTestFile}.\n`,
    );
  } else {
    console.log(
      `Running all ${snapshotType} tests to capture warnings and errors.\n`,
    );
  }

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
      // For e2e, show which test files are missing temp files
      const testPaths = await getE2eTestPaths();

      // Map temp files to test files using the new naming scheme
      const existingTempFiles = fs.readdirSync(tempDir);
      const completedTests = new Set();

      for (const tempFile of existingTempFiles) {
        // Extract test name from temp file: warnings-e2e-test-{testname}.json
        const match = tempFile.match(/warnings-e2e-test-(.+)\.json$/u);
        if (match) {
          completedTests.add(match[1]);
        }
      }

      // Find missing test files
      const missingTests: string[] = [];
      for (const testPath of testPaths) {
        const basename = path.basename(testPath);
        const testName = basename.replace(/\.(spec|test)\.(ts|js)$/iu, '');
        const sanitizedTestName = testName
          .replace(/[^a-z0-9]+/giu, '-')
          .replace(/^-|-$/gu, '');

        if (!completedTests.has(sanitizedTestName)) {
          missingTests.push(testPath);
        }
      }

      console.log(`📂 Found ${tempFileCount} temp file(s) from previous run.`);
      console.log(`   ${completedTests.size} test files completed.`);
      console.log(`   ${missingTests.length} test files still need to run.\n`);

      console.log('   Missing test files:');
      missingTests.forEach((test, index) => {
        console.log(`      ${index + 1}. ${test.replace(process.cwd(), '.')}`);
      });

      console.log('\n   Re-running all tests...\n');
    } else {
      // For unit/integration, we run all tests since they're faster to run
      console.log(`📂 Found ${tempFileCount} temp file(s) from previous run.`);
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
    let exitCode = 0;
    const failedTests: string[] = [];
    let missingTests: string[] = [];

    // Handle specific test file if provided
    if (specificTestFile) {
      console.log('🎯 Running single test file...\n');

      const originalEnv = process.env;
      process.env = { ...originalEnv, ...env };

      try {
        if (snapshotType === 'e2e') {
          await runInShell('node', [
            'test/e2e/run-e2e-test.js',
            specificTestFile,
          ]);
        } else if (snapshotType === 'unit') {
          await runInShell('yarn', [
            'jest',
            '--passWithNoTests',
            specificTestFile,
          ]);
        } else if (snapshotType === 'integration') {
          await runInShell('yarn', [
            'test:integration',
            '--passWithNoTests',
            specificTestFile,
          ]);
        }
        console.log(`\n✅ Test passed: ${specificTestFile}\n`);
      } catch (error: unknown) {
        console.log(`\n❌ Test failed: ${specificTestFile}\n`);
        exitCode = 1;
      } finally {
        process.env = originalEnv;
      }
    } else if (snapshotType === 'e2e' && hasExistingTempFiles) {
      // For e2e tests, intelligently run only missing tests if temp files exist
      const testPaths = await getE2eTestPaths();
      const existingTempFiles = fs.readdirSync(tempDir);
      const completedTests = new Set();

      for (const tempFile of existingTempFiles) {
        const match = tempFile.match(/warnings-e2e-test-(.+)\.json$/u);
        if (match) {
          completedTests.add(match[1]);
        }
      }

      // Find missing test files
      missingTests = [];
      for (const testPath of testPaths) {
        const basename = path.basename(testPath);
        const testName = basename.replace(/\.(spec|test)\.(ts|js)$/iu, '');
        const sanitizedTestName = testName
          .replace(/[^a-z0-9]+/giu, '-')
          .replace(/^-|-$/gu, '');

        if (!completedTests.has(sanitizedTestName)) {
          missingTests.push(testPath);
        }
      }

      if (missingTests.length === 0) {
        console.log(
          '✅ All tests have temp files! Proceeding to aggregation...\n',
        );
      } else {
        console.log(
          `🎯 Running ${missingTests.length} missing test(s) (skipping ${completedTests.size} already completed)...\n`,
        );

        // Run each missing test individually
        const originalEnv = process.env;
        process.env = { ...originalEnv, ...env };

        try {
          for (let i = 0; i < missingTests.length; i++) {
            const testFile = missingTests[i];
            const displayPath = testFile.replace(process.cwd(), '.');

            console.log(
              `[${i + 1}/${missingTests.length}] Running ${displayPath}...`,
            );

            try {
              await runInShell('node', ['test/e2e/run-e2e-test.js', testFile]);
              console.log(`✅ Passed ${displayPath}\n`);
            } catch (error: unknown) {
              console.log(`❌ Failed ${displayPath}\n`);
              failedTests.push(displayPath);
              // Continue running other tests instead of breaking
            }
          }

          // Set exit code if any tests failed
          if (failedTests.length > 0) {
            exitCode = 1;
          }
        } finally {
          process.env = originalEnv;
        }
      }
    } else {
      // For unit/integration, or e2e without temp files, run all tests in batch
      if (snapshotType === 'e2e') {
        const testPaths = await getE2eTestPaths();
        console.log(`Found ${testPaths.length} e2e test file(s) to run.\n`);
      }

      const testCommand = TEST_COMMANDS[snapshotType];
      if (!testCommand) {
        throw new Error(`No test command defined for type: ${snapshotType}`);
      }

      exitCode = await runTestCommand(testCommand, env);
    }

    if (exitCode !== 0) {
      console.error(
        '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      );
      if (specificTestFile) {
        console.error(
          '❌ Test failed. Snapshot will not be updated for this test.',
        );
      } else {
        console.error(
          '❌ Some tests failed. Snapshot cannot be generated yet.',
        );
      }
      console.error(
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
      );

      // Show failed tests if we tracked them (from individual test runs)
      if (failedTests.length > 0) {
        console.log('📊 Test Run Results:\n');
        console.log(
          `   ✅ Passed: ${missingTests.length - failedTests.length} test(s)`,
        );
        console.log(`   ❌ Failed: ${failedTests.length} test(s)`);
        console.log(`   📝 Total run: ${missingTests.length} test(s)\n`);

        console.log('❌ Failed Tests:\n');
        failedTests.forEach((test, index) => {
          console.log(`   ${index + 1}. ${test}`);
        });
        console.log();
      }

      // Count temp files to show overall progress
      if (fs.existsSync(tempDir)) {
        const tempFileCount = fs.readdirSync(tempDir).length;

        if (snapshotType === 'e2e') {
          const testPaths = await getE2eTestPaths();
          const totalTests = testPaths.length;
          console.log('📂 Overall Progress:');
          console.log(
            `   ${tempFileCount}/${totalTests} test(s) have temp files saved`,
          );
          console.log(
            `   ${totalTests - tempFileCount} test(s) still need temp files\n`,
          );
          console.log(
            '   ℹ️  Note: Some failed tests may have saved partial temp files.\n',
          );
        } else {
          console.log(
            `📂 Progress: ${tempFileCount} test(s) have saved their warnings/errors.\n`,
          );
        }
      }

      console.log('🔧 Next Steps:\n');

      if (specificTestFile) {
        // Specific test file failed
        console.log('   Step 1: Review the error output above');
        console.log('   Step 2: Fix the test');
        console.log('   Step 3: Re-run to add its warnings to snapshot:');
        console.log(
          `           yarn test:warnings:update:${snapshotType} ${specificTestFile}\n`,
        );
        console.log(
          '   💡 Note: The test must pass before its warnings can be added to snapshot.',
        );
      } else if (snapshotType === 'e2e') {
        if (failedTests.length > 0) {
          console.log('   Step 1: Debug a failing test:');
          if (failedTests.length === 1) {
            console.log(`           yarn test:e2e:single ${failedTests[0]}\n`);
          } else {
            console.log(
              '           yarn test:e2e:single <path-to-failing-test>\n',
            );
            console.log('   Example:');
            console.log(`           yarn test:e2e:single ${failedTests[0]}\n`);
          }
        } else {
          console.log(
            '   Step 1: Review the test output above to identify which test failed\n',
          );
        }

        console.log('   Step 2: After fixing the issue, re-run:');
        console.log(`           yarn test:warnings:update:${snapshotType}\n`);
        console.log('   💡 Tips:');
        console.log('      • Temp files are preserved between runs');
        console.log(
          '      • When all tests pass, the snapshot auto-generates! 🎯',
        );
      } else {
        console.log('   Step 2: Fix the failing test(s)\n');
        console.log('   Step 3: Run this command again:');
        console.log(`           yarn test:warnings:update:${snapshotType}\n`);
        console.log(
          '   💡 Tip: Temp files are preserved. When all tests pass,',
        );
        console.log('           the snapshot will be auto-generated! 🎯');
      }

      process.exit(1);
    }

    // Aggregate and save snapshot based on mode
    if (specificTestFile) {
      // Specific test mode: Always aggregate if the test passed
      console.log(
        '\n✅ Test passed! Aggregating and updating snapshot with this test...',
      );

      process.env.WARNINGS_SNAPSHOT_TYPE = snapshotType;
      const { aggregateAndSaveSnapshot } = await import(
        '../test/helpers/console-snapshot.js'
      );
      const hasChanges = aggregateAndSaveSnapshot(specificTestFile);

      if (hasChanges) {
        console.log(
          `\n✅ Snapshot updated with new warnings from: ${specificTestFile}`,
        );
      } else {
        console.log(`\n✅ No new warnings from this test. Snapshot unchanged.`);
      }
      console.log(`   Check test/test-warnings-snapshot-${snapshotType}.json`);
      console.log('\n🧹 Temporary file has been cleaned up.');
    } else {
      // All tests mode: Only aggregate if ALL tests have temp files
      const shouldAggregate =
        snapshotType === 'e2e'
          ? await checkAllE2eTestsHaveTempFiles(tempDir)
          : true; // For unit/integration, trust exitCode === 0

      if (shouldAggregate) {
        console.log(
          '\n✅ All tests passed! Aggregating and saving snapshot...',
        );

        process.env.WARNINGS_SNAPSHOT_TYPE = snapshotType;
        const { aggregateAndSaveSnapshot } = await import(
          '../test/helpers/console-snapshot.js'
        );
        aggregateAndSaveSnapshot();

        const typeLabel =
          snapshotType.charAt(0).toUpperCase() + snapshotType.slice(1);
        console.log(`\n✅ ${typeLabel} tests snapshot generation complete!`);
        console.log(
          `   Check test/test-warnings-snapshot-${snapshotType}.json`,
        );
        console.log('\n🧹 All temporary files have been cleaned up.');
      } else {
        console.log(
          '\n⚠️  Not all tests have temp files yet. Snapshot not generated.',
        );
        console.log(
          '   Run the command again to continue from where you left off.',
        );
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error generating snapshot:', error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
