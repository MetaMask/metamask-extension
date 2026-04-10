import * as fs from 'fs';
import * as path from 'path';

// Usage: bun run report-failing-tests/parse-test-failures.ts test-runs-chrome.json test-failures-chrome.csv
// Usage: bun run report-failing-tests/parse-test-failures.ts test-runs-firefox.json test-runs-firefox.csv

// ── Types matching test-runs-chrome.json ──

interface Job {
  name: string;
  id: number;
  runId: number;
  prNumber: number;
}

interface TestCase {
  name: string;
  time: number;
  status: 'passed' | 'failed' | 'skipped';
  error?: string;
}

interface TestSuiteAttempt {
  name: string;
  job: Job;
  date: string;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  attempts: TestSuiteAttempt[];
  testCases: TestCase[];
}

interface TestFile {
  path: string;
  tests: number;
  passed: number;
  failed: number;
  skipped: number;
  time: number;
  testSuites: TestSuiteAttempt[];
}

interface TestRun {
  name: string;
  testFiles: TestFile[];
}

// ── Error classification ──

type ErrorCategory =
  | 'Timeout'
  | 'StaleElement'
  | 'ElementNotFound'
  | 'AnvilCrash'
  | 'AssertionError'
  | 'NetworkError'
  | 'SessionError'
  | 'ScriptError'
  | 'SnapshotMismatch'
  | 'Other';

function classifyError(error: string): ErrorCategory {
  if (/timeout/i.test(error)) return 'Timeout';
  if (/stale element/i.test(error)) return 'StaleElement';
  if (/no such element|element.*not.*found|unable to locate/i.test(error))
    return 'ElementNotFound';
  if (/anvil exited|address already in use/i.test(error)) return 'AnvilCrash';
  if (/assert|expect.*to|expected.*but/i.test(error)) return 'AssertionError';
  if (/ECONNREFUSED|ECONNRESET|fetch failed|network/i.test(error))
    return 'NetworkError';
  if (/session.*deleted|session not created|target closed/i.test(error))
    return 'SessionError';
  if (/script error|ReferenceError|TypeError|SyntaxError/i.test(error))
    return 'ScriptError';
  if (/snapshot/i.test(error)) return 'SnapshotMismatch';
  return 'Other';
}

function extractShortError(error: string): string {
  const firstLine = error.split('\n')[0].trim();
  const maxLen = 200;
  return firstLine.length > maxLen
    ? firstLine.slice(0, maxLen) + '...'
    : firstLine;
}

// ── Collect all failing test cases across suites (including retries) ──

interface FailingTest {
  testName: string;
  error: string;
  errorCategory: ErrorCategory;
  shortError: string;
  timeMs: number;
}

interface FileFailureSummary {
  filePath: string;
  runName: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  totalTimeMs: number;
  failureRate: string;
  failingTests: FailingTest[];
}

function collectFailingTests(suite: TestSuiteAttempt): FailingTest[] {
  const failures: FailingTest[] = [];
  for (const tc of suite.testCases) {
    if (tc.status === 'failed' && tc.error) {
      failures.push({
        testName: tc.name,
        error: tc.error,
        errorCategory: classifyError(tc.error),
        shortError: extractShortError(tc.error),
        timeMs: tc.time,
      });
    }
  }
  for (const attempt of suite.attempts) {
    failures.push(...collectFailingTests(attempt));
  }
  return failures;
}

function deduplicateFailures(failures: FailingTest[]): FailingTest[] {
  const seen = new Map<string, FailingTest>();
  for (const f of failures) {
    if (!seen.has(f.testName)) {
      seen.set(f.testName, f);
    }
  }
  return Array.from(seen.values());
}

// ── Main ──

function main() {
  const scriptDir = path.dirname(new URL(import.meta.url).pathname);
  const inputPath = process.argv[2] || 'test-runs-chrome.json';
  const outputPath = process.argv[3] || 'test-failures-chrome.csv';

  const resolvedInput = path.resolve(scriptDir, inputPath);
  const resolvedOutput = path.resolve(scriptDir, outputPath);

  const raw = fs.readFileSync(resolvedInput, 'utf-8');
  const runs: TestRun[] = JSON.parse(raw);

  const summaries: FileFailureSummary[] = [];

  for (const run of runs) {
    for (const file of run.testFiles) {
      if (file.failed === 0) continue;

      const allFailures: FailingTest[] = [];
      for (const suite of file.testSuites) {
        allFailures.push(...collectFailingTests(suite));
      }

      const dedupedFailures = deduplicateFailures(allFailures);
      if (dedupedFailures.length === 0) continue;

      const failureRate =
        file.tests > 0
          ? ((file.failed / file.tests) * 100).toFixed(1) + '%'
          : 'N/A';

      summaries.push({
        filePath: file.path,
        runName: run.name,
        totalTests: file.tests,
        passed: file.passed,
        failed: file.failed,
        skipped: file.skipped,
        totalTimeMs: file.time,
        failureRate,
        failingTests: dedupedFailures,
      });
    }
  }

  summaries.sort((a, b) => {
    const rateDiff =
      b.failed / (b.totalTests || 1) - a.failed / (a.totalTests || 1);
    if (Math.abs(rateDiff) > 0.001) return rateDiff;
    return b.failed - a.failed;
  });

  // ── Build CSV ──

  const csvEscape = (val: string) => {
    if (val.includes('"') || val.includes(',') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headers = [
    'File Path',
    'Run Name',
    'Total Tests',
    'Passed',
    'Failed',
    'Skipped',
    'Failure Rate',
    'Time (s)',
    'Failing Test Name',
    'Error Category',
    'Short Error',
  ];

  const rows: string[][] = [];

  for (const summary of summaries) {
    for (const ft of summary.failingTests) {
      rows.push([
        summary.filePath,
        summary.runName,
        String(summary.totalTests),
        String(summary.passed),
        String(summary.failed),
        String(summary.skipped),
        summary.failureRate,
        (summary.totalTimeMs / 1000).toFixed(1),
        ft.testName,
        ft.errorCategory,
        ft.shortError,
      ]);
    }
  }

  const csvContent = [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\n');

  fs.writeFileSync(resolvedOutput, csvContent, 'utf-8');

  // ── Print summary to stdout ──

  const totalFailingFiles = summaries.length;
  const totalFailingTests = summaries.reduce(
    (sum, s) => sum + s.failingTests.length,
    0,
  );

  const categoryCounts = new Map<ErrorCategory, number>();
  for (const s of summaries) {
    for (const ft of s.failingTests) {
      categoryCounts.set(
        ft.errorCategory,
        (categoryCounts.get(ft.errorCategory) || 0) + 1,
      );
    }
  }

  console.log(`\n=== Test Failure Report ===`);
  console.log(`Input:  ${resolvedInput}`);
  console.log(`Output: ${resolvedOutput}`);
  console.log(`Failing files: ${totalFailingFiles}`);
  console.log(`Failing tests: ${totalFailingTests} (deduplicated)`);
  console.log(`CSV rows:      ${rows.length}\n`);

  console.log(`Error category breakdown:`);
  const sortedCategories = [...categoryCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  for (const [cat, count] of sortedCategories) {
    console.log(`  ${cat.padEnd(18)} ${count}`);
  }

  console.log(`\nTop 10 worst files (by failure rate):`);
  for (const s of summaries.slice(0, 10)) {
    console.log(
      `  ${s.failureRate.padStart(6)}  ${String(s.failed).padStart(2)}/${String(s.totalTests).padStart(2)} failed  ${s.filePath}`,
    );
  }

  console.log(`\nDone. CSV written to ${resolvedOutput}\n`);
}

main();
