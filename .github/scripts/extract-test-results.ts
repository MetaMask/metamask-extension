import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { normalizeTestPath, XML } from './shared/utils';

/**
 * Result of extracting test paths from previous run results.
 */
export interface ExtractedTestResults {
  /** Test files that passed (all suites passed) */
  passed: string[];
  /** Test files that failed (at least one suite failed) */
  failed: string[];
  /** All test files that were executed */
  executed: string[];
}

/**
 * Extracts the paths of test files that passed and failed in a previous run.
 * On re-run, we only run failed tests - passed tests are skipped and
 * tests that were never executed stay in the queue.
 *
 * A test file is only considered "passed" if ALL of its test suites pass.
 * This handles files with multiple test suites where some pass and some fail.
 *
 * @param resultsDir - Directory containing XML test result files
 * @returns Object containing arrays of passed, failed, and executed test file paths
 */
export async function extractTestResults(
  resultsDir: string,
): Promise<ExtractedTestResults> {
  const emptyResult: ExtractedTestResults = {
    passed: [],
    failed: [],
    executed: [],
  };

  if (!existsSync(resultsDir)) {
    console.log(`Results directory does not exist: ${resultsDir}`);
    return emptyResult;
  }

  const files = readdirSync(resultsDir).filter((f) => f.endsWith('.xml'));

  if (files.length === 0) {
    console.log(`No XML files found in: ${resultsDir}`);
    return emptyResult;
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

  return {
    passed: passedTests,
    failed: [...failedTests],
    executed: [...executedTests],
  };
}

/**
 * CLI entry point for testing the script directly
 */
if (require.main === module) {
  const resultsDir =
    process.argv[2] || 'previous-test-results/test/test-results/e2e';

  extractTestResults(resultsDir)
    .then((results) => {
      console.log('Passed tests:', results.passed);
      console.log('Failed tests:', results.failed);
      console.log('Executed tests:', results.executed);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
