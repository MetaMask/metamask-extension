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
 * 0 — no allowlisted (GATED_METRICS) metric exceeded its fail threshold, and
 * every allowlisted metric of each entry present produced a value
 * 1 — at least one allowlisted metric exceeded its fail threshold, or produced
 * no value in an entry the artifact contains; non-allowlisted breaches are
 * degraded to warnings and do not block
 * 2 — usage error or fatal crash
 */

import { promises as fs } from 'fs';
import path from 'path';
import { parseArgs } from 'util';

import {
  BENCHMARK_PLATFORMS,
  THRESHOLD_SEVERITY,
} from '../../shared/constants/benchmarks';
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
  applyNoiseTolerance,
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
 * Whether the browser recorded a web vital as unsupported in every iteration.
 *
 * The collector writes a web vital as `null` when its observer did not fire,
 * which on Firefox is how `cls` appears: `LayoutShift` is not implemented there.
 * A null on Chrome is not that. Chrome supports every web vital the suite
 * collects, so a null there means collection failed, and it stays a failure.
 *
 * @param artifactName - Artifact filename without extension.
 * @param results - The benchmark entry.
 * @param metricId - The metric to check.
 * @returns True when every recorded iteration holds `null` for the metric.
 */
function isUnsupportedByBrowser(
  artifactName: string,
  results: BenchmarkResults,
  metricId: string,
): boolean {
  if (parseArtifactName(artifactName)?.browser === BENCHMARK_PLATFORMS.CHROME) {
    return false;
  }
  const runs = results.webVitals?.runs ?? [];
  return (
    runs.length > 0 &&
    runs.every(
      (run) =>
        metricId in run && (run as Record<string, unknown>)[metricId] === null,
    )
  );
}

/**
 * Gated metrics that a benchmark entry should carry and does not.
 *
 * `runComparison` iterates what the artifact contains, so a gated metric the
 * artifact lacks is never compared, never breaches a threshold, and lets the
 * gate exit 0. The check is scoped per entry because `GATED_METRICS` spans every
 * preset: a gated `swap.*` metric is required only where the artifact has a
 * `swap` entry.
 *
 * It runs on loaded artifacts rather than inside `runComparison`, whose unit
 * test fixtures carry one metric per entry and would all read as incomplete.
 *
 * @param benchmarks - The loaded benchmark artifacts.
 * @returns `missing`: gated metrics with no value. `unsupported`: gated web
 * vitals the browser recorded as unsupported in every iteration, which are
 * reported and do not fail. Both as `<artifact>:<benchmark>.<metricId>`.
 */
export function findMissingGatedMetrics(benchmarks: LoadedBenchmark[]): {
  missing: string[];
  unsupported: string[];
} {
  const missing: string[] = [];
  const unsupported: string[] = [];
  for (const { name, data } of benchmarks) {
    for (const [entryName, results] of Object.entries(data)) {
      const prefix = `${entryName}.`;
      for (const key of GATED_METRICS) {
        if (!key.startsWith(prefix)) {
          continue;
        }
        const metricId = key.slice(prefix.length);
        if (results.p75?.[metricId] !== undefined) {
          continue;
        }
        const label = `${name}:${entryName}.${metricId}`;
        if (isUnsupportedByBrowser(name, results, metricId)) {
          unsupported.push(label);
        } else {
          missing.push(label);
        }
      }
    }
  }
  return { missing, unsupported };
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
      const comparison = applyNoiseTolerance(
        applyGatingPolicy(rawComparison, GATED_METRICS),
        results,
      );

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
          if (absoluteSeverity) {
            // Absolute-gate driven: report the ceiling and measured value, not
            // the relative delta (which may be a stale/incomparable baseline —
            // even an improvement). Never present a relative improvement as the
            // reason for the red/yellow.
            const violation = comparison.absoluteViolations.find(
              (v) => v.metricId === metric && v.percentile === pKey,
            );
            details.push(
              violation
                ? `${pKey}: ${formatValue(violation.value)} (absolute ceiling exceeded, limit ${formatValue(violation.threshold)})`
                : `${pKey}: ${formatValue(rel.current)} (absolute ceiling exceeded)`,
            );
          } else {
            const delta = formatDeltaPercent(rel.deltaPercent);
            details.push(`${pKey}: ${formatValue(rel.current)} (${delta})`);
          }
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

  // A gated metric missing from the artifact was never compared above, so without
  // this check it could not fail the run.
  const { missing, unsupported } = findMissingGatedMetrics(benchmarks);
  for (const key of unsupported) {
    console.log(`n/a  ${key}: not supported by this browser`);
  }
  if (missing.length > 0) {
    console.log('\n───────────────────────────────────────');
    console.error(
      `FAIL: ${missing.length} gated metric(s) produced no value. ` +
        `A gated metric that is absent is a failure, not a pass.`,
    );
    for (const key of missing) {
      console.error(`      missing: ${key}`);
    }
  }

  process.exit(result.anyFailed || missing.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(2);
  });
}
