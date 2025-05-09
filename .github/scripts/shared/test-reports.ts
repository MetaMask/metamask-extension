export const CONSTANT_TIME_PER_TESTCASE = 3000; // 3 seconds to setup/tear down each test case

export interface TestRun {
  name: string;
  testFiles: TestFile[];
}

export interface TestFile {
  path: string;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  timePlusSetup?: number;
  testSuites: TestSuite[];
}

export interface TestSuite {
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
}

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

export interface TestChunk {
  time: number;
  paths: string[];
}

export function getTestFilesSortedByTime(testRun: TestRun) {
  // add CONSTANT_TIME_PER_TESTCASE
  testRun.testFiles.forEach((file) => {
    file.timePlusSetup = file.time + CONSTANT_TIME_PER_TESTCASE * file.tests;
  });

  return testRun.testFiles.sort((a, b) => {
    return (b?.timePlusSetup ?? 0) - (a?.timePlusSetup ?? 0);
  });
}

export function getNewBlankTestFile(path: string): TestFile {
  return {
    path,
    time: CONSTANT_TIME_PER_TESTCASE, // if there's no information, which in most cases is it.skip() for all tests
    tests: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    testSuites: [],
  };
}
