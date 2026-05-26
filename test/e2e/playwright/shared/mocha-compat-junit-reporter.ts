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
 * option is supplied), so non-e2e Playwright workflows (swap, global,
 * benchmark) are unaffected.
 *
 * See: docs/superpowers/specs/2026-05-26-selenium-to-playwright-e2e-migration-design.md
 */

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

  readonly #buckets = new Map<string, SpecBucket>();

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

    let bucket = this.#buckets.get(filePath);
    if (!bucket) {
      bucket = {
        filePath,
        total: 0,
        failures: 0,
        skipped: 0,
        totalDurationMs: 0,
        testCases: [],
      };
      this.#buckets.set(filePath, bucket);
    }

    bucket.total += 1;
    bucket.totalDurationMs += result.duration;

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

    if (result.status === 'skipped') {
      bucket.skipped += 1;
      // mocha-junit-reporter omits skipped tests from <testcase>; the
      // parser derives skipped count from `tests - testcase.length`.
      return;
    }

    if (result.status === 'passed') {
      bucket.testCases.push({
        name: fullName,
        durationSeconds: result.duration / 1000,
      });
      return;
    }

    bucket.failures += 1;
    const failureText = (result.errors ?? [])
      .map((err) => err.stack ?? err.message ?? '')
      .join('\n')
      .trim();
    bucket.testCases.push({
      name: fullName,
      durationSeconds: result.duration / 1000,
      failure: failureText || `Test failed with status: ${result.status}`,
    });
  }

  async onEnd(_result: FullResult): Promise<void> {
    if (!this.#outputFile || this.#buckets.size === 0) {
      return;
    }

    const buckets = [...this.#buckets.values()].sort((a, b) =>
      a.filePath.localeCompare(b.filePath),
    );
    const xml = this.#renderXml(buckets);

    await fs.promises.mkdir(path.dirname(this.#outputFile), {
      recursive: true,
    });
    await fs.promises.writeFile(this.#outputFile, xml, 'utf8');
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
          lines.push(
            `      <failure>${escapeXml(testCase.failure)}</failure>`,
          );
          lines.push('    </testcase>');
        }
      }

      lines.push('  </testsuite>');
    }

    lines.push('</testsuites>');
    return lines.join('\n');
  }
}
