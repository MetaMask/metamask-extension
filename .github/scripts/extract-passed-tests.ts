import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { normalizeTestPath, XML } from './shared/utils';

/**
 * Extracts the paths of test files that passed in a previous run.
 * On re-run, we skip these tests and only run the rest (failed + never executed).
 *
 * A test file is only considered "passed" if ALL of its test suites pass.
 * This handles files with multiple test suites where some pass and some fail.
 *
 * @param resultsDir - Directory containing XML test result files
 * @returns Array of normalized test file paths that fully passed
 */
export async function extractPassedTestPaths(
  resultsDir: string,
): Promise<string[]> {
  if (!existsSync(resultsDir)) {
    console.log(`Results directory does not exist: ${resultsDir}`);
    return [];
  }

  const files = readdirSync(resultsDir).filter((f) => f.endsWith('.xml'));

  if (files.length === 0) {
    console.log(`No XML files found in: ${resultsDir}`);
    return [];
  }

  // Track all executed test files and which ones have failures
  const executedTests = new Set<string>();
  const failedTests = new Set<string>();

  for (const file of files) {
    try {
      const content = readFileSync(path.join(resultsDir, file), 'utf-8');
      const result = await XML.parse(content);

      for (const suite of result.testsuites?.testsuite || []) {
        if (!suite.$.file) {
          continue;
        }

        const testPath = normalizeTestPath(suite.$.file);
        executedTests.add(testPath);

        const failures = parseInt(suite.$.failures || '0', 10);
        const errors = parseInt(suite.$.errors || '0', 10);

        // If ANY suite in the file has failures/errors, mark the file as failed
        if (failures > 0 || errors > 0) {
          failedTests.add(testPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to parse XML file ${file}:`, error);
    }
  }

  // Passed tests = executed tests that have NO failures in ANY suite
  const passedTests = [...executedTests].filter(
    (testPath) => !failedTests.has(testPath),
  );

  console.log(`Found ${executedTests.size} executed test files`);
  console.log(`Found ${failedTests.size} failed test files`);
  console.log(`Found ${passedTests.length} fully passed test files`);

  return passedTests;
}

/**
 * CLI entry point for testing the script directly
 */
if (require.main === module) {
  const resultsDir =
    process.argv[2] || 'previous-test-results/test/test-results/e2e';

  extractPassedTestPaths(resultsDir)
    .then((passedTests) => {
      console.log('Passed tests:', passedTests);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
