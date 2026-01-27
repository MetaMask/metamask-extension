import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from 'fs';
import path from 'path';
import { normalizeTestPath, XML } from './shared/utils';

/**
 * Merges test results from a previous run into the current results directory.
 * Only copies results for tests that were NOT executed in the current run.
 * This preserves results for tests that were skipped (passed in previous runs).
 *
 * This is needed for re-runs (attempt > 2) where:
 * - Attempt 1: All tests run, results uploaded
 * - Attempt 2: Only failed tests re-run, but artifact only contains those results
 * - Attempt 3+: Would lose information about tests that passed in attempt 1
 *
 * By merging, we ensure all historical pass/fail information is preserved.
 */
export async function mergeTestResults(
  previousResultsDir: string,
  currentResultsDir: string,
): Promise<void> {
  // Ensure current results directory exists
  mkdirSync(currentResultsDir, { recursive: true });

  if (!existsSync(previousResultsDir)) {
    console.log(
      `Previous results directory does not exist: ${previousResultsDir}`,
    );
    return;
  }

  // Get test files that have results in current run
  const currentTestFiles = await getTestFilesFromResults(currentResultsDir);
  console.log(`Found ${currentTestFiles.size} test files in current results`);

  // Get XML files from previous results and copy if test not in current
  const previousXmls = readdirSync(previousResultsDir).filter((f) =>
    f.endsWith('.xml'),
  );
  let copiedCount = 0;

  for (const xmlFile of previousXmls) {
    const previousXmlPath = path.join(previousResultsDir, xmlFile);
    const testFiles = await getTestFilesFromXml(previousXmlPath);

    // Check if ANY test in this XML was executed in current run
    const alreadyExecuted = testFiles.some((tf) => currentTestFiles.has(tf));

    if (!alreadyExecuted && testFiles.length > 0) {
      // Copy the XML file - preserves result for skipped test
      const destPath = path.join(currentResultsDir, xmlFile);
      if (!existsSync(destPath)) {
        copyFileSync(previousXmlPath, destPath);
        copiedCount++;
        console.log(`Copied result for skipped test: ${testFiles[0]}`);
      }
    }
  }

  console.log(`Merged ${copiedCount} test result files from previous run`);
}

/**
 * Gets all test file paths from XML results in a directory
 */
async function getTestFilesFromResults(
  resultsDir: string,
): Promise<Set<string>> {
  const testFiles = new Set<string>();

  if (!existsSync(resultsDir)) {
    return testFiles;
  }

  const xmlFiles = readdirSync(resultsDir).filter((f) => f.endsWith('.xml'));

  for (const file of xmlFiles) {
    const files = await getTestFilesFromXml(path.join(resultsDir, file));
    files.forEach((f) => testFiles.add(f));
  }

  return testFiles;
}

/**
 * Extracts test file paths from an XML result file
 */
async function getTestFilesFromXml(xmlPath: string): Promise<string[]> {
  try {
    const content = readFileSync(xmlPath, 'utf-8');
    const result = await XML.parse(content);
    const files: string[] = [];

    for (const suite of result.testsuites?.testsuite || []) {
      if (suite.$.file) {
        files.push(normalizeTestPath(suite.$.file));
      }
    }

    return files;
  } catch (error) {
    console.warn(`Failed to parse ${xmlPath}:`, error);
    return [];
  }
}

/**
 * CLI entry point
 */
if (require.main === module) {
  const previousDir =
    process.argv[2] || './previous-test-results/test/test-results/e2e';
  const currentDir = process.argv[3] || './test/test-results/e2e';

  mergeTestResults(previousDir, currentDir)
    .then(() => console.log('Merge complete'))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

