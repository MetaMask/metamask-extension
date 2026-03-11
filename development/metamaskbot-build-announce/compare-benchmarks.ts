/**
 * CI Comparison Script
 *
 * Compares current benchmark results against:
 *
 * 1. Constant threshold limits (THRESHOLD_REGISTRY) — primary pass/fail gate
 * 2. Historical baseline from extension_benchmark_stats — informational delta
 *
 * Usage:
 * yarn tsx development/metamaskbot-build-announce/compare-benchmarks.ts \
 * --current <path-to-benchmark-json-directory>
 *
 * Exit codes:
 * 0 — all benchmarks within constant fail limits
 * 1 — at least one benchmark exceeded a constant fail limit
 * 2 — usage error or fatal crash
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parseArgs } from 'util';
import {
  ThresholdSeverity,
  PercentileKey,
} from '../../shared/constants/benchmarks';
import type {
  BenchmarkResults,
  ThresholdConfig,
} from '../../shared/constants/benchmarks';
import { toKebabCase } from '../../shared/lib/string-utils';
import { THRESHOLD_REGISTRY } from '../../test/e2e/benchmarks/utils/constants';
import {
  compareBenchmarkEntries,
  formatDeltaPercent,
  getTrafficLightIndication,
  ComparisonSeverity,
  ComparisonDirection,
  type BenchmarkEntryComparison,
} from './comparison-utils';
import type { HistoricalBaselineReference } from './historical-comparison';
import { fetchHistoricalPerformanceData } from './historical-comparison';

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
 * Resolves the ThresholdConfig for a benchmark.
 * Tries direct match, then strips common prefixes (and converts to kebab-case),
 * then converts original name to kebab-case.
 *
 * @param benchmarkName - Benchmark name (from JSON filename).
 */
export function resolveThresholdConfig(
  benchmarkName: string,
): ThresholdConfig | undefined {
  if (THRESHOLD_REGISTRY[benchmarkName]) {
    return THRESHOLD_REGISTRY[benchmarkName];
  }

  const prefixes = [
    /^benchmark-chrome-browserify-/u,
    /^benchmark-firefox-browserify-/u,
    /^benchmark-chrome-webpack-/u,
  ];
  for (const prefix of prefixes) {
    const stripped = benchmarkName.replace(prefix, '');
    if (stripped !== benchmarkName) {
      // Try stripped name directly
      if (THRESHOLD_REGISTRY[stripped]) {
        return THRESHOLD_REGISTRY[stripped];
      }
      // Try stripped name converted to kebab-case
      const strippedKebab = toKebabCase(stripped);
      if (strippedKebab && THRESHOLD_REGISTRY[strippedKebab]) {
        return THRESHOLD_REGISTRY[strippedKebab];
      }
    }
  }

  // Convert original name to kebab-case
  const kebab = toKebabCase(benchmarkName);
  if (kebab && THRESHOLD_REGISTRY[kebab]) {
    return THRESHOLD_REGISTRY[kebab];
  }

  return undefined;
}

/**
 * Loads the historical baseline.
 */
export async function loadBaseline(): Promise<HistoricalBaselineReference> {
  const result = await fetchHistoricalPerformanceData();
  return result ?? {};
}

/**
 * Resolves baseline metrics for a benchmark entry.
 * Historical keys use "preset/entryName" format (e.g.
 * "userJourneyOnboardingImport/onboardingImportWallet"),
 * so we try direct match first, then suffix match.
 *
 * @param baseline - Historical baseline reference.
 * @param entryName - Benchmark entry name from JSON.
 * @param fileName - Benchmark file name (without extension).
 */
function resolveBaseline(
  baseline: HistoricalBaselineReference,
  entryName: string,
  fileName: string,
): HistoricalBaselineReference[string] | undefined {
  const strippedFileName = fileName.replace(/^benchmark-/u, '');

  const candidates = [entryName, strippedFileName, fileName];

  for (const candidate of candidates) {
    if (baseline[candidate]) {
      return baseline[candidate];
    }
    const suffixMatch = Object.keys(baseline).find((key) =>
      key.endsWith(`/${candidate}`),
    );
    if (suffixMatch) {
      return baseline[suffixMatch];
    }
  }

  return undefined;
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
    for (const [entryName, results] of Object.entries(data)) {
      const thresholdConfig =
        resolveThresholdConfig(entryName) ?? resolveThresholdConfig(name);

      if (!thresholdConfig) {
        console.warn(
          `No threshold config for "${entryName}" (file: ${name}). Skipping.`,
        );
        continue;
      }

      const baselineMetrics = resolveBaseline(baseline, entryName, name);

      const comparison = compareBenchmarkEntries(
        entryName,
        results,
        thresholdConfig,
        baselineMetrics,
      );

      comparisons.push(comparison);

      if (comparison.absoluteFailed) {
        anyFailed = true;
      }
    }
  }

  return { comparisons, anyFailed };
}

function violationIcon(severity: ThresholdSeverity): string {
  const mapped =
    severity === ThresholdSeverity.Fail
      ? ComparisonSeverity.Regression
      : ComparisonSeverity.Warn;
  return getTrafficLightIndication(mapped, ComparisonDirection.Slower);
}

type MetricLine = { metric: string; parts: string[] };

/**
 * Builds display lines for a single benchmark comparison.
 * Metrics with baseline show relative deltas; metrics without show "(no baseline)".
 * Absolute violations override the indication icon with the appropriate indicator.
 *
 * @param comparison - A single benchmark entry comparison result.
 */
function buildMetricLines(comparison: BenchmarkEntryComparison): MetricLine[] {
  const violationsByKey = new Map(
    comparison.absoluteViolations.map((v) => [
      `${v.metricId}:${v.percentile}`,
      v.severity,
    ]),
  );

  const relativeByKey = new Map(
    comparison.relativeMetrics.map((m) => [`${m.metric}:${m.percentile}`, m]),
  );

  const allMetrics = new Map<string, PercentileKey[]>();
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

  return [...allMetrics.entries()].map(([metric, percentiles]) => {
    const parts = percentiles.map((pKey) => {
      const key = `${metric}:${pKey}`;
      const rel = relativeByKey.get(key);
      if (rel) {
        const delta = formatDeltaPercent(rel.deltaPercent, rel.direction);
        const absoluteSeverity = violationsByKey.get(key);
        let icon: string;
        if (absoluteSeverity === ThresholdSeverity.Fail) {
          icon = getTrafficLightIndication(
            ComparisonSeverity.Regression,
            rel.direction,
          );
        } else if (absoluteSeverity === ThresholdSeverity.Warn) {
          icon = getTrafficLightIndication(
            ComparisonSeverity.Warn,
            rel.direction,
          );
        } else if (rel.severity === ComparisonSeverity.Regression) {
          icon = getTrafficLightIndication(
            ComparisonSeverity.Warn,
            rel.direction,
          );
        } else {
          icon = rel.indication;
        }
        return `${icon} ${pKey}: ${rel.current.toFixed(0)}ms (${delta})`;
      }
      const violation = comparison.absoluteViolations.find(
        (v) => v.metricId === metric && v.percentile === pKey,
      );
      const icon = violation
        ? violationIcon(violation.severity)
        : getTrafficLightIndication(
            ComparisonSeverity.Neutral,
            ComparisonDirection.Same,
          );
      const value = violation?.value ?? 0;
      return `${icon} ${pKey}: ${value.toFixed(0)}ms (no baseline)`;
    });
    return { metric, parts };
  });
}

/**
 * Prints a human-readable report of the comparison results.
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
  console.log('  Performance Benchmark Comparison');
  console.log('═══════════════════════════════════════\n');

  for (const comparison of result.comparisons) {
    const status = comparison.absoluteFailed ? 'FAIL' : 'PASS';
    console.log(`\n${status}  ${comparison.benchmarkName}\n`);

    const lines = buildMetricLines(comparison);

    if (lines.length === 0) {
      console.log('    (no historical baseline data)');
    }
    for (const { metric, parts } of lines) {
      console.log(`    ${metric}: ${parts.join(' | ')}`);
    }
  }

  const failCount = result.comparisons.filter((c) => c.absoluteFailed).length;
  const warnCount = result.comparisons.filter(
    (c) =>
      !c.absoluteFailed &&
      c.absoluteViolations.some((v) => v.severity === ThresholdSeverity.Warn),
  ).length;

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
    console.warn('No benchmark JSON files found in', values.current);
    process.exit(0);
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
