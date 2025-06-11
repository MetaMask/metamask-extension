import { hasProperty } from '@metamask/utils';
import { readFileSync } from 'node:fs';
import {
  getNewBlankTestFile,
  getTestFilesSortedByTime,
  TestChunk,
  TestRun,
} from './shared/test-reports';

function readTestResults(TEST_RESULTS_PATH: string): TestRun | undefined {
  const testSuiteName =
    process.env.TEST_SUITE_NAME || 'test-e2e-chrome-browserify';

  try {
    const testRuns: TestRun[] = JSON.parse(
      readFileSync(TEST_RESULTS_PATH, 'utf8'),
    );

    const testRun: TestRun | undefined = testRuns.find(
      (run) => run.name === testSuiteName,
    );

    return testRun;
  } catch (error) {
    if (
      error instanceof Error &&
      hasProperty(error, 'code') &&
      error.code === 'ENOENT'
    ) {
      console.warn(
        `Test results file not found, doing a naïve split instead: ${TEST_RESULTS_PATH}`,
      );

      // If the file doesn't exist, return a dummy object to do the naïve split
      return {
        name: testSuiteName,
        testFiles: [],
      };
    } else {
      throw error; // Re-throw if it's a different error
    }
  }
}

function validateChunks(chunks: TestChunk[]): TestChunk[] {
  // Validate that all chunks have valid values
  return chunks.map((chunk) => ({
    time: isNaN(chunk.time) ? 0 : chunk.time,
    paths: chunk.paths || [],
  }));
}

function splitTests(
  testRun: TestRun,
  changedOrNewTests: string[],
  numChunks: number,
  skipQualityGate: boolean = false,
): TestChunk[] {
  const sorted = getTestFilesSortedByTime(testRun);

  const chunks = Array.from({ length: numChunks }, () => ({
    time: 0,
    paths: [] as string[],
  }));

  sorted.forEach((testFile) => {
    // Quality Gate Retries - 1 si debe evitar, 4 si es normal
    const RETRIES_FOR_NEW_OR_CHANGED_TESTS = skipQualityGate ? 1 : 4;

    const repetitions = changedOrNewTests.includes(testFile.path)
      ? RETRIES_FOR_NEW_OR_CHANGED_TESTS
      : 1;

    for (let i = 0; i < repetitions; i++) {
      const shortestChunk = chunks.reduce((a, b) => (a.time < b.time ? a : b));
      shortestChunk.paths.push(testFile.path);

      shortestChunk.time += testFile.timePlusSetup ?? 0;
    }
  });

  return chunks;
}

export function splitTestsByTimings(
  testList: string[],
  changedOrNewTests: string[],
  totalChunks: number,
  skipQualityGate: boolean = false,
): TestChunk[] {
  // Input validations
  if (totalChunks <= 0) {
    console.warn(`Invalid totalChunks: ${totalChunks}, defaulting to 1`);
    totalChunks = 1;
  }

  if (testList.length === 0) {
    console.warn('Empty test list provided');
    return Array.from({ length: totalChunks }, () => ({ time: 0, paths: [] }));
  }

  const {
    TEST_RESULTS_FILE = `test/test-results/test-runs-${process.env.SELENIUM_BROWSER}.json`,
  } = process.env;

  try {
    const testRunLastTime = readTestResults(TEST_RESULTS_FILE);

    if (testRunLastTime) {
      let testRunNew: TestRun = { name: testRunLastTime.name, testFiles: [] };

      testList.forEach((path) => {
        const testFileLastTime = testRunLastTime.testFiles.find(
          (file) => file.path === path,
        );

        if (testFileLastTime) {
          testRunNew.testFiles.push(testFileLastTime);
        } else {
          testRunNew.testFiles.push(getNewBlankTestFile(path));
        }
      });

      const chunks = splitTests(
        testRunNew,
        changedOrNewTests,
        totalChunks,
        skipQualityGate,
      );

      return validateChunks(chunks);
    }
  } catch (error) {
    console.trace(error);
  }

  // Fallback: make a naive split if there is no historical data
  console.warn('No historical test data found, performing naive test split');
  const naiveTestRun: TestRun = {
    name: process.env.TEST_SUITE_NAME || 'unknown',
    testFiles: testList.map((path) => getNewBlankTestFile(path)),
  };

  const chunks = splitTests(
    naiveTestRun,
    changedOrNewTests,
    totalChunks,
    skipQualityGate,
  );

  return validateChunks(chunks);
}

/**
 * This is a test function that runs if you directly run `yarn tsx .github/scripts/split-tests-by-timings.ts`,
 * which only happens while developing and testing this file. Normally the splitTestsByTimings() function
 * is called by `test/e2e/run-all.ts`.
 *
 * This code is left in to be able to test the output of splitTestsByTimings()
 */
if (require.main === module) {
  const sampleTestList = [
    'test/e2e/tests/account/account-details.spec.ts',
    'test/e2e/tests/account/account-hide-unhide.spec.ts',
    'test/e2e/tests/account/account-pin-unpin.spec.ts',
    'test/e2e/tests/account/add-account.spec.ts',
    'test/e2e/tests/account/snap-account-signatures.spec.ts',
  ];

  const sampleChangedOrNewTests = [
    'test/e2e/tests/account/account-details.spec.ts',
    'test/e2e/tests/account/account-hide-unhide.spec.ts',
    'test/e2e/flask/create-watch-account.spec.ts',
  ];

  process.env.SELENIUM_BROWSER = 'chrome';

  const chunks = splitTestsByTimings(
    sampleTestList,
    sampleChangedOrNewTests,
    3,
    false,
  );

  console.log('chunks', chunks);
}
