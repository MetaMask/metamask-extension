import { hasProperty } from '@metamask/utils';
import { readFileSync } from 'node:fs';
import {
  getNewBlankTestFile,
  getTestFilesSortedByTime,
  TestChunk,
  TestRun,
} from './shared/test-reports';

// Quality Gate Retries
const RETRIES_FOR_NEW_OR_CHANGED_TESTS = 4;

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

function splitTests(
  testRun: TestRun,
  changedOrNewTests: string[],
  numChunks: number,
): TestChunk[] {
  const sorted = getTestFilesSortedByTime(testRun);

  const chunks = Array.from({ length: numChunks }, () => ({
    time: 0,
    paths: [] as string[],
  }));

  sorted.forEach((testFile) => {
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
): TestChunk[] {
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

      return splitTests(testRunNew, changedOrNewTests, totalChunks);
    }
  } catch (error) {
    console.trace(error);
  }

  return [];
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
  );

  console.log('chunks', chunks);
}
