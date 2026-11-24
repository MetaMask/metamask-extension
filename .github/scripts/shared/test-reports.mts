export const BLANK_TEST_FILE_TIME = 3000; // estimate for a test file with no recorded timings

export type TestRun = {
  name: string;
  testFiles: TestFile[];
};

export type TestFile = {
  path: string;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  testSuites: TestSuite[];
};

export type TestSuite = {
  name: string;
  job: {
    name: string;
    id: number;
    runId: number;
    prNumber: number;
  };
  date: Date;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  attempts: TestSuite[];
  testCases: TestCase[];
};

export type TestCase =
  | {
      name: string;
      time: number;
      status: 'passed';
    }
  | {
      name: string;
      time: number;
      status: 'failed';
      error: string;
    };

export type TestChunk = {
  time: number;
  paths: string[];
};

/**
 * Returns a test suite's duration, never less than the sum of its test cases.
 *
 * mocha-junit-reporter only records the time of the most recently started
 * suite when a suite ends. Mocha runs a suite's own tests before its nested
 * suites, so a suite with both is reported as taking 0ms.
 *
 * @param suiteTime - The suite time reported in the JUnit XML, in ms.
 * @param testCases - The suite's test cases.
 * @returns The suite duration in ms.
 */
export function getTestSuiteTime(
  suiteTime: number,
  testCases: TestCase[],
): number {
  const testCasesTime = testCases.reduce((total, { time }) => total + time, 0);
  return Math.max(suiteTime, testCasesTime);
}

/**
 * Returns the test files sorted from slowest to fastest.
 *
 * A file's recorded time already includes the fixture setup and teardown of
 * each test, so no per-test overhead is added on top of it.
 *
 * @param testRun - The test run whose files to sort.
 * @returns The test files, slowest first.
 */
export function getTestFilesSortedByTime(testRun: TestRun): TestFile[] {
  return testRun.testFiles.sort((a, b) => (b?.time ?? 0) - (a?.time ?? 0));
}

export function getNewBlankTestFile(path: string): TestFile {
  return {
    path,
    time: BLANK_TEST_FILE_TIME, // if there's no information, which in most cases is it.skip() for all tests
    tests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    testSuites: [],
  };
}
