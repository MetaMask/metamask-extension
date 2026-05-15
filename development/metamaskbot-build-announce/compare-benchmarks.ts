/**
 * CI Comparison Script
 *
 * Compares current benchmark results against:
 *
 * 1. Constant threshold limits (THRESHOLD_REGISTRY) — primary pass/fail gate
 * 2. Historical baseline from extension_benchmark_stats — informational delta
 *
 * Usage:
 * node development/metamaskbot-build-announce/compare-benchmarks.ts \
 * --current <path-to-benchmark-json-directory>
 *
 * Exit codes:
 * 0 — no allowlisted (GATED_METRICS) metric exceeded its fail threshold
 * 1 — at least one allowlisted metric exceeded its fail threshold;
 * non-allowlisted breaches are degraded to warnings and do not block
 * 2 — usage error or fatal crash
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parseArgs } from 'util';

import { THRESHOLD_SEVERITY } from '../../shared/constants/benchmarks';
import type {
  ThresholdSeverity,
  ComparisonKey,
  BenchmarkResults,
} from '../../shared/constants/benchmarks';
import { GATED_METRICS } from '../../test/e2e/benchmarks/utils/gated-metrics';
import { THRESHOLD_REGISTRY } from '../../test/e2e/benchmarks/utils/thresholds';
import { fetchHistoricalPerformanceDataFromMain } from './historical-comparison';
import type { HistoricalBaselineReference } from './historical-comparison';
import {
  applyGatingPolicy,
  compareBenchmarkEntries,
  formatDeltaPercent,
  scaleThresholdsForBrowser,
  COMPARISON_SEVERITY,
  type BenchmarkEntryComparison,
} from './comparison-utils';
import { parseArtifactName, resolveBaselineFromArtifactName } from './utils';

type LoadedBenchmark = {
  name: string;
  data: Record<string, BenchmarkResults>;
};

/**
 * Loads all benchmark JSON files from a directory.
 *
 * @param dirPath - Path to directory containing benchmark JSON files.
 */
export async function loadCurrentBenchmarks(
  dirPath: string,
): Promise<LoadedBenchmark[]> {
  const entries = await fs.readdir(dirPath);
  const jsonFiles = entries.filter((f) => f.endsWith('.json'));

  const results: LoadedBenchmark[] = [];
  for (const file of jsonFiles) {
    const raw = await fs.readFile(path.join(dirPath, file), 'utf-8');
    const data = JSON.parse(raw) as Record<string, BenchmarkResults>;
    const name = path.basename(file, '.json');
    results.push({ name, data });
  }
  return results;
}

/**
 * Loads the historical baseline.
 */
async function loadBaseline(): Promise<HistoricalBaselineReference> {
  const result = await fetchHistoricalPerformanceDataFromMain();
  return result?.baseline ?? {};
}

/**
 * Runs comparison for all loaded benchmarks.
 *
 * @param benchmarks - Loaded benchmark files.
 * @param baseline - Historical baseline reference.
 */
export function runComparison(
  benchmarks: LoadedBenchmark[],
  baseline: HistoricalBaselineReference,
): { comparisons: BenchmarkEntryComparison[]; anyFailed: boolean } {
  const comparisons: BenchmarkEntryComparison[] = [];
  let anyFailed = false;

  for (const { name, data } of benchmarks) {
    const parsed = parseArtifactName(name);

    for (const [entryName, results] of Object.entries(data)) {
      if (!results.p75 || !results.p95) {
        console.warn(
          `Skipping "${entryName}" in "${name}": missing p75/p95 (benchmark likely failed).`,
        );
        continue;
      }

      const baseThresholdConfig = THRESHOLD_REGISTRY[entryName];

      if (!baseThresholdConfig) {
        console.warn(
          `No threshold config for benchmark "${entryName}" in file "${name}". Add an entry to THRESHOLD_REGISTRY in thresholds.ts.`,
        );
        continue;
      }

      const thresholdConfig = scaleThresholdsForBrowser(
        baseThresholdConfig,
        parsed?.browser,
      );

      const baselineMetrics = resolveBaselineFromArtifactName(
        baseline,
        entryName,
        name,
      );

      const rawComparison = compareBenchmarkEntries(
        entryName,
        results,
        thresholdConfig,
        baselineMetrics,
      );
      const comparison = applyGatingPolicy(rawComparison, GATED_METRICS);

      if (parsed) {
        comparison.source = `${parsed.browser}-${parsed.buildType}`;
      }

      comparisons.push(comparison);

      if (comparison.absoluteFailed) {
        anyFailed = true;
      }
    }
  }

  return { comparisons, anyFailed };
}

function violationIcon(severity: ThresholdSeverity): string {
  return severity === THRESHOLD_SEVERITY.Fail
    ? COMPARISON_SEVERITY.Regression.icon
    : COMPARISON_SEVERITY.Warn.icon;
}

export type MetricLine = {
  metric: string;
  icon: string;
  hasIssue: boolean;
  details?: string;
};

/**
 * Builds display lines for a single benchmark comparison.
 *
 * @param comparison - A single benchmark entry comparison result.
 */
export function buildMetricLines(
  comparison: BenchmarkEntryComparison,
): MetricLine[] {
  const violationsByKey = new Map(
    comparison.absoluteViolations.map((v) => [
      `${v.metricId}:${v.percentile}`,
      v.severity,
    ]),
  );

  const relativeByKey = new Map(
    comparison.relativeMetrics.map((m) => [`${m.metric}:${m.percentile}`, m]),
  );

  const allMetrics = new Map<string, ComparisonKey[]>();
  for (const m of comparison.relativeMetrics) {
    const list = allMetrics.get(m.metric) ?? [];
    list.push(m.percentile);
    allMetrics.set(m.metric, list);
  }
  for (const v of comparison.absoluteViolations) {
    const list = allMetrics.get(v.metricId) ?? [];
    if (!list.includes(v.percentile)) {
      list.push(v.percentile);
    }
    allMetrics.set(v.metricId, list);
  }

  // Helper function to update displayIcon to track worst severity
  const updateDisplayIcon = (
    icon: string,
    currentDisplayIcon: string,
  ): string => {
    switch (icon) {
      case COMPARISON_SEVERITY.Regression.icon:
        return COMPARISON_SEVERITY.Regression.icon;
      case COMPARISON_SEVERITY.Warn.icon:
        return currentDisplayIcon === COMPARISON_SEVERITY.Pass.icon
          ? COMPARISON_SEVERITY.Warn.icon
          : currentDisplayIcon;
      default:
        return currentDisplayIcon;
    }
  };

  return [...allMetrics.entries()].map(([metric, percentiles]) => {
    let displayIcon: string = COMPARISON_SEVERITY.Pass.icon;
    let hasIssue = false;
    const details: string[] = [];
    const formatValue = (value: number): string =>
      metric === 'cls' ? value.toFixed(3) : `${value.toFixed(0)}ms`;

    for (const pKey of percentiles) {
      const key = `${metric}:${pKey}`;
      const rel = relativeByKey.get(key);
      const absoluteSeverity = violationsByKey.get(key);

      let icon: string;
      let isIssue = false;

      if (rel) {
        if (absoluteSeverity) {
          switch (absoluteSeverity) {
            case THRESHOLD_SEVERITY.Fail:
              icon = COMPARISON_SEVERITY.Regression.icon;
              isIssue = true;
              break;
            case THRESHOLD_SEVERITY.Warn:
              icon = COMPARISON_SEVERITY.Warn.icon;
              isIssue = true;
              break;
            default:
              icon = rel.indication;
          }
        } else {
          switch (rel.severity) {
            case COMPARISON_SEVERITY.Regression.value:
            case COMPARISON_SEVERITY.Warn.value:
              icon = COMPARISON_SEVERITY.Warn.icon;
              isIssue = true;
              break;
            default:
              icon = rel.indication;
          }
        }

        if (isIssue) {
          const delta = formatDeltaPercent(rel.deltaPercent);
          details.push(`${pKey}: ${formatValue(rel.current)} (${delta})`);
          hasIssue = true;
          displayIcon = updateDisplayIcon(icon, displayIcon);
        }
      } else {
        const violation = comparison.absoluteViolations.find(
          (v) => v.metricId === metric && v.percentile === pKey,
        );
        if (violation) {
          icon = violationIcon(violation.severity);
          isIssue = true;
          details.push(
            `${pKey}: ${formatValue(violation.value)} (no baseline)`,
          );
          hasIssue = true;
          displayIcon = updateDisplayIcon(icon, displayIcon);
        }
      }
    }

    return {
      metric,
      icon: displayIcon,
      hasIssue,
      details: hasIssue ? details.join(' | ') : undefined,
    };
  });
}

function formatName(comparison: BenchmarkEntryComparison): string {
  const source = comparison.source ? ` [${comparison.source}]` : '';
  return `${comparison.benchmarkName}${source}`;
}

/**
 * Prints a human-readable report of the comparison results.
 *
 * Output groups entries by severity (FAIL → WARN → PASS) and includes
 * browser/buildType source labels for disambiguation.
 *
 * @param result - Comparison results.
 * @param result.comparisons
 * @param result.anyFailed
 */
export function printReport(result: {
  comparisons: BenchmarkEntryComparison[];
  anyFailed: boolean;
}): void {
  console.log('\n═══════════════════════════════════════');
  console.log('  Performance Benchmark Quality Gate');
  console.log('═══════════════════════════════════════');

  // Pre-compute metric lines to avoid duplicate work
  const withLines = result.comparisons.map((c) => ({
    comparison: c,
    lines: buildMetricLines(c),
  }));

  const failed = withLines.filter((w) => w.comparison.absoluteFailed);
  const warned = withLines.filter(
    (w) =>
      !w.comparison.absoluteFailed &&
      (w.comparison.absoluteViolations.some(
        (v) => v.severity === THRESHOLD_SEVERITY.Warn,
      ) ||
        w.lines.some((l) => l.hasIssue)),
  );
  const passed = withLines.filter(
    (w) =>
      !w.comparison.absoluteFailed &&
      !w.comparison.absoluteViolations.some(
        (v) => v.severity === THRESHOLD_SEVERITY.Warn,
      ) &&
      !w.lines.some((l) => l.hasIssue),
  );

  // Show failed entries with details
  for (const { comparison, lines } of failed) {
    console.log(`\nFAIL  ${formatName(comparison)}`);
    for (const line of lines.filter((l) => l.hasIssue)) {
      const details = line.details ? ` | ${line.details}` : '';
      console.log(`      ${line.icon} ${line.metric}${details}`);
    }
  }

  // Show warned entries with details
  for (const { comparison, lines } of warned) {
    console.log(`\nWARN  ${formatName(comparison)}`);
    for (const line of lines.filter((l) => l.hasIssue)) {
      const details = line.details ? ` | ${line.details}` : '';
      console.log(`      ${line.icon} ${line.metric}${details}`);
    }
  }

  // Show passing entries grouped by benchmark name
  if (passed.length > 0) {
    const grouped = new Map<string, string[]>();
    for (const { comparison } of passed) {
      const list = grouped.get(comparison.benchmarkName) ?? [];
      list.push(comparison.source ?? '');
      grouped.set(comparison.benchmarkName, list);
    }

    console.log(`\nPASS  ${passed.length} benchmarks within thresholds`);
    for (const [name, sources] of grouped) {
      const filtered = sources.filter(Boolean);
      const suffix = filtered.length > 0 ? `: ${filtered.join(', ')}` : '';
      console.log(`      ${name}${suffix}`);
    }
  }

  const failCount = failed.length;
  const warnCount = warned.length;

  console.log('\n───────────────────────────────────────');
  console.log(
    `Total: ${result.comparisons.length} benchmarks | ${failCount} failed | ${warnCount} warnings`,
  );

  if (result.anyFailed) {
    console.log(
      '\nRESULT: FAIL — at least one benchmark exceeds constant fail limit',
    );
  } else {
    console.log('\nRESULT: PASS — all benchmarks within constant limits');
  }
}

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      current: { type: 'string' },
    },
    strict: true,
  });

  if (!values.current) {
    console.error('Usage: --current <path-to-benchmark-json-dir>');
    process.exit(2);
  }

  const benchmarks = await loadCurrentBenchmarks(values.current);
  if (benchmarks.length === 0) {
    console.error('No benchmark JSON files found in', values.current);
    process.exit(1);
  }

  const baseline = await loadBaseline();

  const result = runComparison(benchmarks, baseline);
  printReport(result);

  process.exit(result.anyFailed ? 1 : 0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(2);
  });
}
