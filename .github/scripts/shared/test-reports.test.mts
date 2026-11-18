import {
  getTestFilesSortedByTime,
  getTestSuiteTime,
  type TestCase,
  type TestFile,
} from './test-reports.mts';

function buildTestFile(path: string, time: number, tests: number): TestFile {
  return {
    path,
    time,
    tests,
    passed: tests,
    failed: 0,
    skipped: 0,
    testSuites: [],
  };
}

const testCases: TestCase[] = [
  { name: 'first', time: 300, status: 'passed' },
  { name: 'second', time: 400, status: 'failed', error: 'Error' },
];

describe('getTestSuiteTime', () => {
  it('uses the test cases time when the reported suite time is 0', () => {
    expect(getTestSuiteTime(0, testCases)).toBe(700);
  });

  it('keeps the reported suite time when it includes hooks', () => {
    expect(getTestSuiteTime(900, testCases)).toBe(900);
  });

  it('returns the reported suite time when there are no test cases', () => {
    expect(getTestSuiteTime(50, [])).toBe(50);
  });
});

describe('getTestFilesSortedByTime', () => {
  it('sorts files by recorded time regardless of how many tests they have', () => {
    const sorted = getTestFilesSortedByTime({
      name: 'test-e2e-chrome-webpack',
      testFiles: [
        buildTestFile('few-long-tests.spec.ts', 60_000, 2),
        buildTestFile('many-short-tests.spec.ts', 50_000, 30),
        buildTestFile('slowest.spec.ts', 90_000, 5),
      ],
    });

    expect(sorted.map(({ path }) => path)).toStrictEqual([
      'slowest.spec.ts',
      'few-long-tests.spec.ts',
      'many-short-tests.spec.ts',
    ]);
  });
});
