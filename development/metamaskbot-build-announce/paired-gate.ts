/**
 * The quality gate's verdict on the series admitted under ADR 0072, from the
 * per-run head-minus-base differences of a flow's paired jobs.
 */

import { isPlainObject } from '@metamask/utils';
import {
  ADMITTED_SERIES,
  type AdmittedSeries,
} from '../../test/e2e/benchmarks/utils/gated-metrics';
import {
  decidePaired,
  type PairedDecision,
  type PairedVerdict,
} from '../../test/e2e/benchmarks/utils/paired-decision';
import { parseArtifactName } from './utils';

/** A results file as `loadCurrentBenchmarks` reads it. */
export type PairedGateInput = {
  /** The artifact's file name without `.json`. */
  name: string;
  /** The runner's results, keyed by flow. */
  data: Record<string, unknown>;
};

/**
 * `incomplete`: the leg gave no usable values, or its result carries an error,
 * so there is nothing to decide. `deferred`: the leg is complete and its
 * decision waits for the flow's other jobs.
 */
export type PairedGateVerdict = PairedVerdict | 'incomplete' | 'deferred';

export type PairedGateOutcome = {
  /** `<browser>-<buildType>` of the artifacts pooled, or the artifact name. */
  source: string;
  series: string;
  deltaBlockMs: number;
  verdict: PairedGateVerdict;
  /** `block`, `unable` and `incomplete` fail the gate. */
  failed: boolean;
  decision?: PairedDecision;
  problems: string[];
};

type Group = {
  source: string;
  entry: AdmittedSeries;
  differences: number[];
  problems: string[];
};

const PAIRS = [
  [0, 1],
  [2, 3],
] as const;

/** Where paired jobs run: Chrome, webpack build. */
export const PAIRED_SOURCE = 'chrome-webpack';

/** Differences per admitted series: two from each of its four paired jobs. */
export const PAIRED_DIFFERENCES = 8;

/** The flow a series belongs to and its id in the flow's `values`. */
function splitSeries(series: string): { flow: string; metricId: string } {
  const [flow, ...rest] = series.split('.');
  return { flow, metricId: rest.join('.') };
}

/**
 * The build of each measured run by position, or why the runs cannot be paired:
 * not four runs, two of each build, or positions (0, 1) and (2, 3) not each
 * holding a base and a head run.
 */
function buildsByPosition(
  pairing: unknown,
): { builds: Record<number, string> } | { problem: string } {
  const runs = isPlainObject(pairing) ? pairing.runs : undefined;
  const builds: Record<number, string> = {};
  for (const run of Array.isArray(runs) ? runs : []) {
    if (
      isPlainObject(run) &&
      typeof run.position === 'number' &&
      typeof run.build === 'string'
    ) {
      builds[run.position] = run.build;
    }
  }
  const positions = Object.keys(builds)
    .map(Number)
    .sort((a, b) => a - b)
    .join();
  const sorted = Object.values(builds)
    .sort((a, b) => a.localeCompare(b))
    .join();
  if (
    !Array.isArray(runs) ||
    runs.length !== 4 ||
    positions !== '0,1,2,3' ||
    sorted !== 'base,base,head,head'
  ) {
    return { problem: 'pairing.runs is not four runs, two of each build' };
  }
  if (PAIRS.some(([first, second]) => builds[first] === builds[second])) {
    return {
      problem: `runs do not alternate: positions 0-1 and 2-3 must each hold a base and a head run, not ${[0, 1, 2, 3].map((position) => builds[position]).join(', ')}`,
    };
  }
  return { builds };
}

// The page loads each run reports with no value for one series. A run's mean skips
// them, so a head run whose slowest loads gave none would look faster than base:
// any run with one fails the series. A run that reports no count has nothing to check.
function missingLoadProblems(pairing: unknown, metricId: string): string[] {
  const runs = isPlainObject(pairing) ? pairing.runs : undefined;
  const problems: string[] = [];
  for (const run of Array.isArray(runs) ? runs : []) {
    if (!isPlainObject(run) || !isPlainObject(run.missingCount)) {
      continue;
    }
    if (!(metricId in run.missingCount)) {
      continue;
    }
    const missing = run.missingCount[metricId];
    const label = `run ${String(run.position)} (${String(run.build)})`;
    if (
      typeof missing !== 'number' ||
      !Number.isInteger(missing) ||
      missing < 0
    ) {
      problems.push(
        `${label}: the missing count for "${metricId}" is ${String(missing)}`,
      );
    } else if (missing > 0) {
      problems.push(
        `${label}: ${missing} page ${missing === 1 ? 'load' : 'loads'} gave no "${metricId}" value`,
      );
    }
  }
  return problems;
}

// The mean of each run's retained values for one series, by position, from
// `values` (want `head`) or `baseValues` (want `base`).
function runMeans(
  samples: unknown,
  want: 'head' | 'base',
  builds: Record<number, string>,
  problems: string[],
): Map<number, number> {
  const retained = new Map<number, number[]>();
  for (const sample of Array.isArray(samples) ? samples : []) {
    if (!isPlainObject(sample)) {
      continue;
    }
    const { position, build, value } = sample;
    if (
      typeof position !== 'number' ||
      build !== want ||
      builds[position] !== want
    ) {
      problems.push(
        `a ${want} value sits at position ${String(position)}, a ${builds[position as number] ?? 'missing'} run, tagged ${String(build)}`,
      );
      continue;
    }
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      !sample.excluded &&
      !sample.excludedBy
    ) {
      retained.set(position, [...(retained.get(position) ?? []), value]);
    }
  }
  return new Map(
    [...retained].map(([position, values]) => [
      position,
      values.reduce((sum, value) => sum + value, 0) / values.length,
    ]),
  );
}

// Head minus base for each base run and the head run beside it, positions
// (0, 1) and (2, 3), the pairs ADR 0072's comparator forms.
function pairDifferences(
  results: Record<PropertyKey, unknown>,
  metricId: string,
  builds: Record<number, string>,
  problems: string[],
): number[] {
  const values = isPlainObject(results.values)
    ? results.values[metricId]
    : undefined;
  const baseValues = isPlainObject(results.baseValues)
    ? results.baseValues[metricId]
    : undefined;
  if (!Array.isArray(values) || values.length === 0) {
    problems.push(`no head values for "${metricId}"`);
  }
  if (!Array.isArray(baseValues) || baseValues.length === 0) {
    problems.push(`no base values for "${metricId}"`);
  }
  problems.push(...missingLoadProblems(results.pairing, metricId));
  if (problems.length > 0) {
    return [];
  }

  const head = runMeans(values, 'head', builds, problems);
  const base = runMeans(baseValues, 'base', builds, problems);
  const differences: number[] = [];
  for (const [first, second] of PAIRS) {
    const [headPosition, basePosition] =
      builds[first] === 'head' ? [first, second] : [second, first];
    const headMean = head.get(headPosition);
    const baseMean = base.get(basePosition);
    if (headMean === undefined || baseMean === undefined) {
      problems.push(
        `"${metricId}": run ${headMean === undefined ? headPosition : basePosition} gave no retained value`,
      );
    } else {
      differences.push(headMean - baseMean);
    }
  }
  return problems.length > 0 ? [] : differences;
}

/**
 * @param benchmarks - The result files; a flow's jobs pool per browser and build.
 * @param decide - `false` only checks the values are there, for one leg.
 * @param requireAll - A series missing any paired job's differences fails.
 */
export function evaluatePairedGate(
  benchmarks: readonly PairedGateInput[],
  decide = true,
  requireAll = false,
): PairedGateOutcome[] {
  const groups = new Map<string, Group>();
  const groupFor = (source: string, entry: AdmittedSeries): Group => {
    const key = `${source}\u0000${entry.series}`;
    let group = groups.get(key);
    if (!group) {
      group = { source, entry, differences: [], problems: [] };
      groups.set(key, group);
    }
    return group;
  };

  for (const { name, data } of benchmarks) {
    const parsed = parseArtifactName(name);
    const source = parsed ? `${parsed.browser}-${parsed.buildType}` : name;

    for (const [flow, results] of Object.entries(data)) {
      const admitted = ADMITTED_SERIES.filter(
        (entry) => splitSeries(entry.series).flow === flow,
      );
      if (admitted.length === 0 || !isPlainObject(results)) {
        continue;
      }

      const pairedJob =
        'pairing' in results ||
        'baseValues' in results ||
        /-(?:r\d+-)?(?:base-head-head-base|head-base-base-head)$/u.test(name);
      // The leg check still fails an unpaired job's error, in that job; the
      // gate decides admitted series from paired jobs only.
      if (!pairedJob && decide) {
        continue;
      }
      if (results.error !== undefined && results.error !== null) {
        for (const entry of admitted) {
          groupFor(source, entry).problems.push(
            `${name}: ${flow} carries an error: ${String(results.error).slice(0, 200)}`,
          );
        }
        continue;
      }
      if (!('pairing' in results || 'baseValues' in results)) {
        continue;
      }

      const pairing = buildsByPosition(results.pairing);
      for (const entry of admitted) {
        const group = groupFor(source, entry);
        const problems: string[] = [];
        const differences =
          'builds' in pairing
            ? pairDifferences(
                results,
                splitSeries(entry.series).metricId,
                pairing.builds,
                problems,
              )
            : [];
        if ('problem' in pairing) {
          problems.push(pairing.problem);
        }
        group.problems.push(
          ...problems.map((problem) => `${name}: ${problem}`),
        );
        group.differences.push(...differences);
      }
    }
  }

  if (decide && requireAll) {
    for (const entry of ADMITTED_SERIES) {
      const group = groupFor(PAIRED_SOURCE, entry);
      if (
        group.problems.length === 0 &&
        group.differences.length !== PAIRED_DIFFERENCES
      ) {
        group.problems.push(
          `${group.differences.length} of ${PAIRED_DIFFERENCES} differences: a paired job's results are missing`,
        );
      }
    }
  }

  return [...groups.values()].map(
    ({ source, entry, differences, problems }): PairedGateOutcome => {
      const base = {
        source,
        series: entry.series,
        deltaBlockMs: entry.deltaBlockMs,
        problems,
      };
      if (problems.length > 0) {
        return { ...base, verdict: 'incomplete', failed: true };
      }
      if (!decide) {
        return { ...base, verdict: 'deferred', failed: false };
      }
      const decision = decidePaired(differences, entry.deltaBlockMs);
      return {
        ...base,
        decision,
        verdict: decision.verdict,
        failed: decision.verdict !== 'no-block',
      };
    },
  );
}

/**
 * One report line for a series' outcome.
 *
 * @param outcome - What `evaluatePairedGate` decided.
 */
export function formatPairedOutcome(outcome: PairedGateOutcome): string {
  const prefix = `${outcome.series} [${outcome.source}]`;
  const { decision } = outcome;
  const ms = (value: number | null | undefined): string =>
    value === null || value === undefined ? 'n/a' : `${value.toFixed(1)}ms`;
  switch (outcome.verdict) {
    case 'incomplete':
      return `${prefix}: no verdict, ${outcome.problems.join('; ')}`;
    case 'deferred':
      return `${prefix}: complete, decided with the flow's other jobs`;
    case 'unable':
      return `${prefix}: inconclusive, ${decision?.n ?? 0} differences are too few for a 95% bound (blocks)`;
    default:
      return `${prefix}: ${outcome.verdict}, ${decision?.n} differences, shift ${ms(decision?.shift)}, lower bound ${ms(decision?.lower)} against δ_block ${ms(outcome.deltaBlockMs)}`;
  }
}
