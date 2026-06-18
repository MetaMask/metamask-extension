/**
 * Playwright JUnit reporter that emits XML in the shape consumed by the
 * central e2e test report parser at `.github/scripts/create-e2e-test-report.mts`.
 *
 * The parser was originally written for the output of
 * `mocha-junit-reporter` and strictly requires:
 *
 * 1. A `file=` attribute on every `<testsuite>` element (otherwise the
 * entire suite is silently skipped by the parser).
 * 2. A `<properties>` block on each `<testsuite>` containing
 * `JOB_NAME`, `RUN_ID`, `PR_NUMBER` — these come from the
 * `PROPERTIES` env var that `run-e2e.yml` already exports.
 *
 * Playwright's built-in `junit` reporter emits neither, so PW test
 * results never appear in the aggregated chrome/firefox e2e reports.
 * This adapter bridges the two formats while we migrate specs from
 * Selenium to Playwright. It activates only when
 * `PLAYWRIGHT_JUNIT_OUTPUT_FILE` is set (or an explicit `outputFile`
 * option is supplied), so the benchmark Playwright project is
 * unaffected.
 *
 * Output is written as **one XML file per spec file**, not a single
 * batched file. `PLAYWRIGHT_JUNIT_OUTPUT_FILE` is treated as a base
 * name: each spec gets `<base>-<specHash><ext>`. This matches
 * `mocha-junit-reporter`'s `[hash].xml` convention and, crucially,
 * keeps `.github/scripts/merge-test-results.mts` correct on CI
 * re-runs. That merge copies a previous XML only when none of its
 * suites ran in the current attempt; with a batched file, re-running a
 * single spec would skip the merge for the whole batch and drop the
 * other specs' results. One-spec-per-file makes that check exact.
 *
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

type Options = {
  /**
   * Path to the XML output file. When omitted, falls back to the
   * `PLAYWRIGHT_JUNIT_OUTPUT_FILE` environment variable. If neither is
   * provided, the reporter is a no-op.
   */
  outputFile?: string;
};

type SpecBucket = {
  filePath: string;
  total: number;
  failures: number;
  skipped: number;
  totalDurationMs: number;
  testCases: {
    name: string;
    durationSeconds: number;
    failure?: string;
  }[];
};

/**
 * The latest known outcome for a single Playwright test, keyed in the
 * reporter by `TestCase.id`. PW calls `onTestEnd` for every attempt
 * when `--retries` is enabled, so the reporter overwrites this record
 * on each call — the last write wins. At `onEnd` we fold the surviving
 * per-test records into the per-file suite buckets. This matches the
 * behavior of `mocha-junit-reporter`, which only ever records the
 * final outcome of a test (passed if any attempt passed; otherwise
 * the final failure).
 */
type TestRecord = {
  filePath: string;
  fullName: string;
  durationSeconds: number;
  status: TestResult['status'];
  failure?: string;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;')
    .replace(/"/gu, '&quot;')
    .replace(/'/gu, '&apos;');
}

/**
 * Parses the `PROPERTIES` env var that `run-e2e.yml` exports for
 * mocha-junit-reporter. The shape is a comma-separated list of
 * `KEY:value` pairs, e.g.
 * `PROPERTIES=JOB_NAME:test-e2e-chrome-playwright,RUN_ID:123,PR_NUMBER:456`.
 *
 * @returns Ordered list of `<property>` entries to embed in each suite.
 */
function parseProperties(): { name: string; value: string }[] {
  const raw = process.env.PROPERTIES;
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((entry) => {
      const colon = entry.indexOf(':');
      if (colon < 0) {
        return null;
      }
      const name = entry.slice(0, colon).trim();
      const value = entry.slice(colon + 1).trim();
      if (!name) {
        return null;
      }
      return { name, value };
    })
    .filter(
      (entry): entry is { name: string; value: string } => entry !== null,
    );
}

export default class MochaCompatJunitReporter implements Reporter {
  readonly #outputFile: string | undefined;

  /**
   * One entry per logical test (keyed by `TestCase.id`). Overwritten on
   * every `onTestEnd` so retried tests collapse to their final outcome
   * before we render the suite buckets at `onEnd`.
   */
  readonly #testRecords = new Map<string, TestRecord>();

  readonly #properties = parseProperties();

  #startedAt = new Date();

  constructor(options: Options = {}) {
    this.#outputFile =
      options.outputFile ?? process.env.PLAYWRIGHT_JUNIT_OUTPUT_FILE;
  }

  onBegin(_config: FullConfig, _root: Suite): void {
    this.#startedAt = new Date();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    if (!this.#outputFile) {
      return;
    }

    const filePath = path
      .relative(process.cwd(), test.location.file)
      .replace(/\\/gu, '/');

    // titlePath() yields [project, file, ...describes, test]. We want
    // just the describe-chain + the test, matching mocha-junit-reporter's
    // `test.fullTitle()`. Filter out empties, the project name, and any
    // segment that looks like a spec file path. This is more robust than
    // a fixed slice index since PW's titlePath shape has shifted between
    // versions.
    const projectName = test.parent.project()?.name;
    const fullName =
      test
        .titlePath()
        .filter(
          (segment) =>
            Boolean(segment) &&
            !segment.endsWith('.spec.ts') &&
            segment !== projectName,
        )
        .join(' ')
        .trim() || test.title;

    const failureText =
      result.status === 'passed' || result.status === 'skipped'
        ? undefined
        : (result.errors ?? [])
            .map((err) => err.stack ?? err.message ?? '')
            .join('\n')
            .trim() || `Test failed with status: ${result.status}`;

    // Overwrite (don't append) — the latest attempt's outcome is the one
    // we want in the report. See `TestRecord` for why.
    this.#testRecords.set(test.id, {
      filePath,
      fullName,
      durationSeconds: result.duration / 1000,
      status: result.status,
      failure: failureText,
    });
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (!this.#outputFile || this.#testRecords.size === 0) {
      return;
    }

    const buckets = this.#foldRecordsIntoBuckets();

    // Treat `#outputFile` as a base name and emit one file per spec, so the
    // XML→spec mapping is 1:1 (see the module docstring on merge-test-results).
    const { dir, name, ext } = path.parse(this.#outputFile);
    const outputDir = dir || '.';
    const extension = ext || '.xml';

    await fs.promises.mkdir(outputDir, { recursive: true });

    await Promise.all(
      buckets.map((bucket) => {
        const specHash = createHash('md5')
          .update(bucket.filePath)
          .digest('hex')
          .slice(0, 8);
        const outputPath = path.join(
          outputDir,
          `${name}-${specHash}${extension}`,
        );
        return fs.promises.writeFile(
          outputPath,
          this.#renderXml([bucket]),
          'utf8',
        );
      }),
    );
  }

  /**
   * Folds the per-test records (one per logical test, post-retry-dedupe)
   * into per-spec-file buckets and sorts the buckets alphabetically.
   *
   * @returns The bucketed suite data the XML renderer consumes.
   */
  #foldRecordsIntoBuckets(): SpecBucket[] {
    const buckets = new Map<string, SpecBucket>();

    for (const record of this.#testRecords.values()) {
      let bucket = buckets.get(record.filePath);
      if (!bucket) {
        bucket = {
          filePath: record.filePath,
          total: 0,
          failures: 0,
          skipped: 0,
          totalDurationMs: 0,
          testCases: [],
        };
        buckets.set(record.filePath, bucket);
      }

      bucket.total += 1;
      bucket.totalDurationMs += record.durationSeconds * 1000;

      if (record.status === 'skipped') {
        bucket.skipped += 1;
        // mocha-junit-reporter omits skipped tests from <testcase>; the
        // parser derives skipped count from `tests - testcase.length`.
        continue;
      }

      if (record.status === 'passed') {
        bucket.testCases.push({
          name: record.fullName,
          durationSeconds: record.durationSeconds,
        });
        continue;
      }

      bucket.failures += 1;
      bucket.testCases.push({
        name: record.fullName,
        durationSeconds: record.durationSeconds,
        failure: record.failure ?? `Test failed with status: ${record.status}`,
      });
    }

    return [...buckets.values()].sort((a, b) =>
      a.filePath.localeCompare(b.filePath),
    );
  }

  #renderXml(buckets: SpecBucket[]): string {
    const totalTests = buckets.reduce((sum, b) => sum + b.total, 0);
    const totalFailures = buckets.reduce((sum, b) => sum + b.failures, 0);
    const totalSeconds =
      buckets.reduce((sum, b) => sum + b.totalDurationMs, 0) / 1000;
    const timestamp = this.#startedAt.toISOString();

    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(
      `<testsuites name="" tests="${totalTests}" failures="${totalFailures}" time="${totalSeconds}">`,
    );

    for (const bucket of buckets) {
      const suiteName = bucket.filePath;
      lines.push(
        `  <testsuite name="${escapeXml(suiteName)}" timestamp="${timestamp}" file="${escapeXml(bucket.filePath)}" tests="${bucket.total}" failures="${bucket.failures}" time="${bucket.totalDurationMs / 1000}">`,
      );

      if (this.#properties.length > 0) {
        lines.push('    <properties>');
        for (const prop of this.#properties) {
          lines.push(
            `      <property name="${escapeXml(prop.name)}" value="${escapeXml(prop.value)}"/>`,
          );
        }
        lines.push('    </properties>');
      }

      for (const testCase of bucket.testCases) {
        if (testCase.failure === undefined) {
          lines.push(
            `    <testcase name="${escapeXml(testCase.name)}" time="${testCase.durationSeconds}"/>`,
          );
        } else {
          lines.push(
            `    <testcase name="${escapeXml(testCase.name)}" time="${testCase.durationSeconds}">`,
          );
          lines.push(`      <failure>${escapeXml(testCase.failure)}</failure>`);
          lines.push('    </testcase>');
        }
      }

      lines.push('  </testsuite>');
    }

    lines.push('</testsuites>');
    return lines.join('\n');
  }
}
