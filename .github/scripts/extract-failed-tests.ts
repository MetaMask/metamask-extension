import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { normalizeTestPath, XML } from './shared/utils';

export interface PreviousRunResults {
  /** Test files that failed or had errors in the previous run */
  failedTests: string[];
  /** All test files that were executed (passed or failed) in the previous run */
  executedTests: string[];
}

/**
 * Extracts test results from XML test results of a previous run.
 * Returns both failed tests and all executed tests, so we can identify
 * tests that were never executed (e.g., due to early termination).
 *
 * @param resultsDir - Directory containing XML test result files
 * @returns Object containing failed tests and all executed tests
 */
export async function extractPreviousRunResults(
  resultsDir: string,
): Promise<PreviousRunResults> {
  if (!existsSync(resultsDir)) {
    console.log(`Results directory does not exist: ${resultsDir}`);
    return { failedTests: [], executedTests: [] };
  }

  const failedTests: string[] = [];
  const executedTests: string[] = [];
  const files = readdirSync(resultsDir).filter((f) => f.endsWith('.xml'));

  if (files.length === 0) {
    console.log(`No XML files found in: ${resultsDir}`);
    return { failedTests: [], executedTests: [] };
  }

  for (const file of files) {
    try {
      const content = readFileSync(path.join(resultsDir, file), 'utf-8');
      const result = await XML.parse(content);

      for (const suite of result.testsuites?.testsuite || []) {
        if (!suite.$.file) {
          continue;
        }

        const testPath = normalizeTestPath(suite.$.file);
        executedTests.push(testPath);

        const failures = parseInt(suite.$.failures || '0', 10);
        const errors = parseInt(suite.$.errors || '0', 10);

        if (failures > 0 || errors > 0) {
          failedTests.push(testPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to parse XML file ${file}:`, error);
    }
  }

  const uniqueFailedTests = [...new Set(failedTests)];
  const uniqueExecutedTests = [...new Set(executedTests)];

  console.log(`Found ${uniqueFailedTests.length} failed test files`);
  console.log(`Found ${uniqueExecutedTests.length} executed test files`);

  return {
    failedTests: uniqueFailedTests,
    executedTests: uniqueExecutedTests,
  };
}

/**
 * CLI entry point for testing the script directly
 */
if (require.main === module) {
  const resultsDir =
    process.argv[2] || 'previous-test-results/test/test-results/e2e';

  extractPreviousRunResults(resultsDir)
    .then((results) => {
      console.log('Failed tests:', results.failedTests);
      console.log('Executed tests:', results.executedTests);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
