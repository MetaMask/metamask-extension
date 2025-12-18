import { existsSync, readdirSync, readFileSync } from 'fs';
import path from 'path';
import { normalizeTestPath, XML } from './shared/utils';

/**
 * Extracts the paths of test files that passed in a previous run.
 * On re-run, we skip these tests and only run the rest (failed + never executed).
 *
 * @param resultsDir - Directory containing XML test result files
 * @returns Array of normalized test file paths that passed
 */
export async function extractPassedTestPaths(
  resultsDir: string,
): Promise<string[]> {
  if (!existsSync(resultsDir)) {
    console.log(`Results directory does not exist: ${resultsDir}`);
    return [];
  }

  const passedTests: string[] = [];
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
        if (!suite.$.file) {
          continue;
        }

        const failures = parseInt(suite.$.failures || '0', 10);
        const errors = parseInt(suite.$.errors || '0', 10);

        // Only track tests that definitively passed (no failures, no errors)
        if (failures === 0 && errors === 0) {
          const testPath = normalizeTestPath(suite.$.file);
          passedTests.push(testPath);
        }
      }
    } catch (error) {
      console.warn(`Failed to parse XML file ${file}:`, error);
    }
  }

  const uniquePassedTests = [...new Set(passedTests)];
  console.log(`Found ${uniquePassedTests.length} passed test files`);

  return uniquePassedTests;
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
