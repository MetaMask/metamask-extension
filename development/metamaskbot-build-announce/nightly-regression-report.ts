/**
 * Nightly Benchmark Regression Report
 *
 * Runs after nightly/scheduled CI builds complete. Downloads benchmark
 * results from the latest nightly run, compares against thresholds,
 * and posts a summary to #extension-performance-alerts via MetaMask Bot.
 *
 * Unlike PR-triggered notifications (Phase 2), this always posts to the
 * dedicated channel, never to team channels, and includes a summary of
 * all benchmarks, not just failures.
 *
 * Usage: yarn tsx development/metamaskbot-build-announce/nightly-regression-report.ts
 * --results path-to-benchmark-json-dir
 *
 * Environment: SLACK_BENCHMARK_WEBHOOK_URL, OWNER, REPOSITORY, RUN_ID
 */

import { parseArgs } from 'util';
import { IncomingWebhook } from '@slack/webhook';
import { THRESHOLD_SEVERITY } from '../../shared/constants/benchmarks';
import type { BenchmarkEntryComparison } from './comparison-utils';
import { loadCurrentBenchmarks, runComparison } from './compare-benchmarks';
import { fetchHistoricalPerformanceDataFromMain } from './historical-comparison';

// ---------------------------------------------------------------------------
// rich_text block helpers (matching post-nightly-builds.ts style)
// ---------------------------------------------------------------------------

function richTextSection(
  elements: Record<string, unknown>[],
): Record<string, unknown> {
  return {
    type: 'rich_text',
    elements: [{ type: 'rich_text_section', elements }],
  };
}

function textEl(
  text: string,
  style?: { bold?: boolean; italic?: boolean },
): Record<string, unknown> {
  return style ? { type: 'text', text, style } : { type: 'text', text };
}

function linkEl(url: string, text: string): Record<string, unknown> {
  return { type: 'link', url, text };
}

function emojiEl(name: string): Record<string, unknown> {
  return { type: 'emoji', name };
}

function divider(): Record<string, unknown> {
  return { type: 'divider' };
}

// ---------------------------------------------------------------------------
// Report formatting
// ---------------------------------------------------------------------------

function formatNightlyReport(
  comparisons: BenchmarkEntryComparison[],
  anyFailed: boolean,
  ciRunUrl?: string,
): { blocks: Record<string, unknown>[] } {
  const failCount = comparisons.filter((c) => c.absoluteFailed).length;
  const warnCount = comparisons.filter(
    (c) =>
      !c.absoluteFailed &&
      c.absoluteViolations.some((v) => v.severity === THRESHOLD_SEVERITY.Warn),
  ).length;
  const passCount = comparisons.length - failCount - warnCount;

  const statusEmoji = anyFailed ? 'red_circle' : 'large_green_circle';
  const statusText = anyFailed ? 'REGRESSIONS DETECTED' : 'ALL PASSING';
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  // Header
  const headerBlock = richTextSection([
    emojiEl(statusEmoji),
    textEl(' Nightly Benchmark Report', { bold: true }),
  ]);

  const dateBlock = richTextSection([textEl(dateStr, { italic: true })]);

  // Summary
  const summaryBlock = richTextSection([
    textEl('Status: ', { bold: true }),
    textEl(`${statusText}\n`),
    textEl('Benchmarks: ', { bold: true }),
    textEl(
      `${comparisons.length} total | ${passCount} pass | ${warnCount} warn | ${failCount} fail\n`,
    ),
  ]);

  const blocks: Record<string, unknown>[] = [
    headerBlock,
    dateBlock,
    divider(),
    summaryBlock,
  ];

  // Failures detail
  const failedComparisons = comparisons.filter((c) => c.absoluteFailed);
  if (failedComparisons.length > 0) {
    const failElements: Record<string, unknown>[] = [
      emojiEl('exclamation'),
      textEl(' Failures\n', { bold: true }),
    ];

    for (const c of failedComparisons) {
      for (const v of c.absoluteViolations.filter(
        (violation) => violation.severity === THRESHOLD_SEVERITY.Fail,
      )) {
        const delta =
          v.threshold > 0
            ? `+${(((v.value - v.threshold) / v.threshold) * 100).toFixed(1)}%`
            : 'N/A';
        failElements.push(
          emojiEl('red_circle'),
          textEl(` ${c.benchmarkName}`, { bold: true }),
          textEl(
            ` — ${v.metricId} (${v.percentile}): ${v.value.toFixed(0)}ms / ${v.threshold.toFixed(0)}ms (${delta})\n`,
          ),
        );
      }
    }

    blocks.push(divider(), richTextSection(failElements));
  }

  // Warnings detail
  const warnComparisons = comparisons.filter(
    (c) =>
      !c.absoluteFailed &&
      c.absoluteViolations.some((v) => v.severity === THRESHOLD_SEVERITY.Warn),
  );
  if (warnComparisons.length > 0) {
    const warnElements: Record<string, unknown>[] = [
      emojiEl('warning'),
      textEl(' Warnings\n', { bold: true }),
    ];

    for (const c of warnComparisons) {
      for (const v of c.absoluteViolations.filter(
        (violation) => violation.severity === THRESHOLD_SEVERITY.Warn,
      )) {
        warnElements.push(
          emojiEl('large_yellow_circle'),
          textEl(` ${c.benchmarkName}`, { bold: true }),
          textEl(
            ` — ${v.metricId} (${v.percentile}): ${v.value.toFixed(0)}ms / ${v.threshold.toFixed(0)}ms\n`,
          ),
        );
      }
    }

    blocks.push(divider(), richTextSection(warnElements));
  }

  // All passing
  if (failedComparisons.length === 0 && warnComparisons.length === 0) {
    blocks.push(
      divider(),
      richTextSection([
        emojiEl('white_check_mark'),
        textEl(' All benchmarks within thresholds.', { italic: true }),
      ]),
    );
  }

  // Build info link
  if (ciRunUrl) {
    blocks.push(
      divider(),
      richTextSection([
        emojiEl('information_source'),
        textEl(' Build Info: ', { bold: true }),
        linkEl(ciRunUrl, 'View Build Logs'),
      ]),
    );
  }

  return { blocks };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      results: { type: 'string' },
    },
    strict: true,
  });

  const { SLACK_BENCHMARK_WEBHOOK_URL, OWNER, REPOSITORY, RUN_ID } =
    process.env;

  if (!SLACK_BENCHMARK_WEBHOOK_URL) {
    console.error('SLACK_BENCHMARK_WEBHOOK_URL is required');
    process.exit(1);
  }

  if (!values.results) {
    console.error('Usage: --results <path-to-benchmark-json-dir>');
    process.exit(2);
  }

  const benchmarks = await loadCurrentBenchmarks(values.results);
  if (benchmarks.length === 0) {
    console.warn('No benchmark JSON files found in', values.results);
    process.exit(0);
  }

  const baselineResult = await fetchHistoricalPerformanceDataFromMain();
  const baseline = baselineResult?.baseline ?? {};
  const result = runComparison(benchmarks, baseline);

  const ciRunUrl =
    OWNER && REPOSITORY && RUN_ID
      ? `https://github.com/${OWNER}/${REPOSITORY}/actions/runs/${RUN_ID}`
      : undefined;

  const payload = formatNightlyReport(
    result.comparisons,
    result.anyFailed,
    ciRunUrl,
  );

  const webhook = new IncomingWebhook(SLACK_BENCHMARK_WEBHOOK_URL);
  await webhook.send({ blocks: payload.blocks });

  console.log(
    `Nightly report posted to Slack. ${result.anyFailed ? 'REGRESSIONS DETECTED' : 'All passing.'}`,
  );
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(2);
});
