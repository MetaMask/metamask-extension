/**
 * Threshold Override Mechanism
 *
 * Allows PRs that intentionally increase metrics to temporarily adjust
 * the constant thresholds used by compare-benchmarks.ts.
 *
 * Overrides are declared in a `.threshold-overrides.json` file at the
 * repo root. Each override targets a specific benchmark/metric/percentile
 * and must include a justification.
 *
 * Overrides apply only to the PR that declares them — the file should
 * not be merged to main (enforced by the check-no-threshold-override
 * workflow). Each entry may carry an `expires` date after which it lapses.
 */

import { promises as fs } from 'fs';
import path from 'path';

import type {
  PercentileKey,
  ThresholdConfig,
} from '../../shared/constants/benchmarks';

export const DEFAULT_OVERRIDE_FILENAME = '.threshold-overrides.json';

const VALID_PERCENTILES: readonly string[] = ['p75', 'p95'];

/**
 * A single threshold override entry.
 */
export type ThresholdOverrideEntry = {
  /** THRESHOLD_REGISTRY key (e.g. 'startupStandardHome') */
  benchmark: string;
  /** Metric name within the benchmark (e.g. 'uiStartup') */
  metric: string;
  /** Which percentile to override ('p75' or 'p95') */
  percentile: PercentileKey;
  /** New warn threshold in ms (optional — keeps existing if omitted) */
  warn?: number;
  /** New fail threshold in ms (optional — keeps existing if omitted) */
  fail?: number;
  /** Required: why the override is needed */
  justification: string;
  /**
   * Optional ISO date (YYYY-MM-DD) after which the override lapses.
   * Applying an expired override throws — renew the date or remove it.
   */
  expires?: string;
};

/**
 * Schema for the `.threshold-overrides.json` file.
 */
export type ThresholdOverrideFile = {
  overrides: ThresholdOverrideEntry[];
};

/**
 * An override entry with the previous values it replaced.
 */
export type AppliedOverride = ThresholdOverrideEntry & {
  previousWarn?: number;
  previousFail?: number;
};

/**
 * Validates an override entry for required fields and correct values.
 *
 * @param entry - The override entry to validate.
 * @param index - Index in the overrides array (for error messages).
 */
function validateEntry(entry: ThresholdOverrideEntry, index: number): void {
  const prefix = `overrides[${index}]`;

  if (!entry.benchmark || typeof entry.benchmark !== 'string') {
    throw new Error(`${prefix}: "benchmark" must be a non-empty string`);
  }
  if (!entry.metric || typeof entry.metric !== 'string') {
    throw new Error(`${prefix}: "metric" must be a non-empty string`);
  }
  if (!VALID_PERCENTILES.includes(entry.percentile)) {
    throw new Error(
      `${prefix}: "percentile" must be "p75" or "p95", got "${String(entry.percentile)}"`,
    );
  }
  if (entry.warn === undefined && entry.fail === undefined) {
    throw new Error(
      `${prefix}: at least one of "warn" or "fail" must be specified`,
    );
  }
  if (
    entry.warn !== undefined &&
    (typeof entry.warn !== 'number' || entry.warn < 0)
  ) {
    throw new Error(`${prefix}: "warn" must be a non-negative number`);
  }
  if (
    entry.fail !== undefined &&
    (typeof entry.fail !== 'number' || entry.fail < 0)
  ) {
    throw new Error(`${prefix}: "fail" must be a non-negative number`);
  }
  if (
    entry.warn !== undefined &&
    entry.fail !== undefined &&
    entry.warn >= entry.fail
  ) {
    throw new Error(
      `${prefix}: "warn" (${entry.warn}) must be less than "fail" (${entry.fail})`,
    );
  }
  if (!entry.justification || typeof entry.justification !== 'string') {
    throw new Error(`${prefix}: "justification" must be a non-empty string`);
  }
  if (
    entry.expires !== undefined &&
    (typeof entry.expires !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/u.test(entry.expires) ||
      Number.isNaN(Date.parse(entry.expires)))
  ) {
    throw new Error(
      `${prefix}: "expires" must be an ISO date string (YYYY-MM-DD)`,
    );
  }
}

/**
 * Validates the full override file structure.
 *
 * @param data - Parsed JSON data.
 */
export function validateOverrides(data: unknown): ThresholdOverrideFile {
  if (!data || typeof data !== 'object') {
    throw new Error('Override file must be a JSON object');
  }

  const file = data as Record<string, unknown>;
  if (!Array.isArray(file.overrides)) {
    throw new Error('Override file must contain an "overrides" array');
  }

  for (let i = 0; i < file.overrides.length; i++) {
    validateEntry(file.overrides[i] as ThresholdOverrideEntry, i);
  }

  return data as ThresholdOverrideFile;
}

/**
 * Loads and validates threshold overrides from a JSON file.
 * Returns null if the file does not exist (normal case — no overrides).
 *
 * @param repoRoot - Repository root directory (defaults to cwd).
 * @param fileName - Override filename (defaults to .threshold-overrides.json).
 */
export async function loadOverrides(
  repoRoot?: string,
  fileName?: string,
): Promise<ThresholdOverrideFile | null> {
  const root = repoRoot ?? process.cwd();
  const filePath = path.join(root, fileName ?? DEFAULT_OVERRIDE_FILENAME);

  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw new Error(
      `Failed to read override file at ${filePath}: ${String(err)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Override file at ${filePath} contains invalid JSON`);
  }

  return validateOverrides(parsed);
}

/**
 * Applies overrides to a threshold registry, returning a new registry
 * with adjusted thresholds and a list of what was applied.
 *
 * Throws if an override targets an unknown benchmark/metric or has
 * expired — a misconfigured override must fail loudly, not silently
 * no-op while the author believes the threshold was relaxed.
 *
 * @param registry - The base threshold registry (not mutated).
 * @param overrides - Validated override file.
 */
export function applyOverrides(
  registry: Record<string, ThresholdConfig>,
  overrides: ThresholdOverrideFile,
): {
  effectiveRegistry: Record<string, ThresholdConfig>;
  applied: AppliedOverride[];
} {
  const effectiveRegistry: Record<string, ThresholdConfig> = {};
  for (const [key, config] of Object.entries(registry)) {
    effectiveRegistry[key] = {};
    for (const [metric, thresholds] of Object.entries(config)) {
      effectiveRegistry[key][metric] = {
        ...(thresholds.p75 ? { p75: { ...thresholds.p75 } } : {}),
        ...(thresholds.p95 ? { p95: { ...thresholds.p95 } } : {}),
        ...(thresholds.ciMultiplier === undefined
          ? {}
          : { ciMultiplier: thresholds.ciMultiplier }),
      };
    }
  }

  const applied: AppliedOverride[] = [];
  const today = new Date().toISOString().slice(0, 10);

  for (const entry of overrides.overrides) {
    const target = `${entry.benchmark}/${entry.metric} (${entry.percentile})`;

    if (entry.expires !== undefined && entry.expires < today) {
      throw new Error(
        `Override for ${target} expired on ${entry.expires}; renew "expires" or remove the entry`,
      );
    }

    const benchConfig = effectiveRegistry[entry.benchmark];
    if (!benchConfig) {
      throw new Error(
        `Override for ${target}: benchmark "${entry.benchmark}" not found in THRESHOLD_REGISTRY`,
      );
    }

    const metricConfig = benchConfig[entry.metric];
    if (!metricConfig) {
      throw new Error(
        `Override for ${target}: metric "${entry.metric}" not found in benchmark "${entry.benchmark}"`,
      );
    }

    const existing = metricConfig[entry.percentile];
    const appliedEntry: AppliedOverride = {
      ...entry,
      previousWarn: existing?.warn,
      previousFail: existing?.fail,
    };

    if (existing) {
      if (entry.warn !== undefined) {
        existing.warn = entry.warn;
      }
      if (entry.fail !== undefined) {
        existing.fail = entry.fail;
      }
    } else {
      metricConfig[entry.percentile] = {
        warn: entry.warn ?? 0,
        fail: entry.fail ?? 0,
      };
    }

    applied.push(appliedEntry);
  }

  return { effectiveRegistry, applied };
}

/**
 * Formats applied overrides for CLI output.
 *
 * @param applied - List of applied overrides.
 */
export function formatOverrideSummary(applied: AppliedOverride[]): string {
  if (applied.length === 0) {
    return '';
  }

  const lines = [
    '',
    '⚠️  Threshold Overrides Active',
    '───────────────────────────────────────',
  ];

  for (const o of applied) {
    const changes: string[] = [];
    if (o.warn !== undefined) {
      changes.push(`warn: ${o.previousWarn ?? '—'}→${o.warn}`);
    }
    if (o.fail !== undefined) {
      changes.push(`fail: ${o.previousFail ?? '—'}→${o.fail}`);
    }
    lines.push(
      `  ${o.benchmark}/${o.metric} (${o.percentile}): ${changes.join(', ')}`,
    );
    lines.push(
      `    ↳ ${o.justification}${o.expires ? ` (expires ${o.expires})` : ''}`,
    );
  }

  lines.push('───────────────────────────────────────');
  return lines.join('\n');
}

/**
 * Formats applied overrides as HTML for PR comment output.
 *
 * @param applied - List of applied overrides.
 */
export function formatOverrideHtml(applied: AppliedOverride[]): string {
  if (applied.length === 0) {
    return '';
  }

  const rows = applied
    .map((o) => {
      const changes: string[] = [];
      if (o.warn !== undefined) {
        changes.push(`warn: ${o.previousWarn ?? '—'} → ${o.warn}`);
      }
      if (o.fail !== undefined) {
        changes.push(`fail: ${o.previousFail ?? '—'} → ${o.fail}`);
      }
      return (
        `<tr>` +
        `<td><code>${o.benchmark}/${o.metric}</code></td>` +
        `<td>${o.percentile}</td>` +
        `<td>${changes.join(', ')}</td>` +
        `<td>${o.justification}</td>` +
        `</tr>`
      );
    })
    .join('');

  return (
    `<details><summary>⚠️ <b>Threshold Overrides Active (${applied.length})</b></summary>\n` +
    `<table><thead><tr><th>Benchmark/Metric</th><th>Percentile</th><th>Change</th><th>Justification</th></tr></thead>` +
    `<tbody>${rows}</tbody></table>\n` +
    `</details>\n`
  );
}
