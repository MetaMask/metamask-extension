import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { normalizeTestPath, XML } from './shared/utils';

/**
 * Extracts the paths of failed test files from XML test results.
 * Used to identify which tests to re-run when a CI job is retried.
 *
 * @param resultsDir - Directory containing XML test result files
 * @returns Array of normalized test file paths that had failures
 */
export async function extractFailedTestPaths(
  resultsDir: string,
): Promise<string[]> {
  if (!existsSync(resultsDir)) {
    console.log(`Results directory does not exist: ${resultsDir}`);
    return [];
  }

  const failedTests: string[] = [];
  const files = readdirSync(resultsDir).filter((f) => f.endsWith('.xml'));

  if (files.length === 0) {
    console.log(`No XML files found in: ${resultsDir}`);
    return [];
  }

  for (const file of files) {
    try {
      const content = readFileSync(path.join(resultsDir, file), 'utf-8');
      const result = await XML.parse(content);

      for (const suite of result.testsuites?.testsuite || []) {
        const failures = parseInt(suite.$.failures || '0', 10);
        const errors = parseInt(suite.$.errors || '0', 10);

        if ((failures > 0 || errors > 0) && suite.$.file) {
          const testPath = normalizeTestPath(suite.$.file);
          failedTests.push(testPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to parse XML file ${file}:`, error);
    }
  }

  // Remove duplicates and return
  const uniqueFailedTests = [...new Set(failedTests)];
  console.log(`Found ${uniqueFailedTests.length} failed test files`);

  return uniqueFailedTests;
}

/**
 * CLI entry point for testing the script directly
 */
if (require.main === module) {
  const resultsDir =
    process.argv[2] || 'previous-test-results/test/test-results/e2e';

  extractFailedTestPaths(resultsDir)
    .then((failedTests) => {
      console.log('Failed tests:', failedTests);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

