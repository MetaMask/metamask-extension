import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { splitTestsByTimings } from './split-tests-by-timings.mts';
import type { TestFile, TestRun } from './shared/test-reports.mts';

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

describe('splitTestsByTimings', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'split-tests-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    delete process.env.TEST_RESULTS_FILE;
    delete process.env.TEST_SUITE_NAME;
  });

  function writeTestRuns(testFiles: TestFile[]) {
    const testRuns: TestRun[] = [
      { name: 'test-e2e-chrome-webpack', testFiles },
    ];
    const testResultsFile = join(tempDir, 'test-runs-chrome.json');
    writeFileSync(testResultsFile, JSON.stringify(testRuns));
    process.env.TEST_RESULTS_FILE = testResultsFile;
    process.env.TEST_SUITE_NAME = 'test-e2e-chrome-webpack';
  }

  it('balances chunks by recorded time, not by number of tests', () => {
    writeTestRuns([
      buildTestFile('a.spec.ts', 60_000, 1),
      buildTestFile('b.spec.ts', 40_000, 20),
      buildTestFile('c.spec.ts', 20_000, 1),
    ]);

    const chunks = splitTestsByTimings(
      ['a.spec.ts', 'b.spec.ts', 'c.spec.ts'],
      [],
      2,
    );

    expect(chunks).toHaveLength(2);
    expect(chunks).toStrictEqual(
      expect.arrayContaining([
        { time: 60_000, paths: ['a.spec.ts'] },
        { time: 60_000, paths: ['b.spec.ts', 'c.spec.ts'] },
      ]),
    );
  });

  it('gives test files without recorded timings a blank estimate', () => {
    writeTestRuns([buildTestFile('known.spec.ts', 10_000, 2)]);

    const chunks = splitTestsByTimings(
      ['known.spec.ts', 'unknown.spec.ts'],
      [],
      2,
    );

    expect(chunks).toStrictEqual(
      expect.arrayContaining([
        { time: 10_000, paths: ['known.spec.ts'] },
        { time: 3_000, paths: ['unknown.spec.ts'] },
      ]),
    );
  });

  it('runs new or changed test files twice', () => {
    writeTestRuns([buildTestFile('changed.spec.ts', 10_000, 2)]);

    const chunks = splitTestsByTimings(
      ['changed.spec.ts'],
      ['changed.spec.ts'],
      2,
    );

    expect(chunks).toStrictEqual([
      { time: 10_000, paths: ['changed.spec.ts'] },
      { time: 10_000, paths: ['changed.spec.ts'] },
    ]);
  });
});
