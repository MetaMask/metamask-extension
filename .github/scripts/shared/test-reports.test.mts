import { getTestSuiteTime, type TestCase } from './test-reports.mts';

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
