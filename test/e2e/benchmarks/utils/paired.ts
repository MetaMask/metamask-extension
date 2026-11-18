import { existsSync, promises as fs } from 'fs';
import path from 'path';
import { isPlainObject } from '@metamask/utils';
import type {
  BenchmarkResults,
  MetricSample,
  TimerStatistics,
  WebVitalsRun,
} from '../../../../shared/constants/benchmarks';
import { convertTimerStatisticsToBenchmarkResults } from './runner';
import {
  aggregateWebVitals,
  calculateTimerStatistics,
  MAX_TOTAL_DURATION_MS,
  WEB_VITALS_NUMERIC_KEYS,
} from './statistics';

/**
 * Paired comparator: a warm-up run of each build, then four measured runs alternating base and head,
 * each in its own process (e2e helpers read a build's `manifest.json` once per process)
 * with `dist` symlinked to that run's build.
 */

/** Run base and head builds in one job when set to `1`. */
export const PAIRED = 'BENCHMARK_PAIRED';

/**
 * Which build leads: `base-head-head-base`, the default, or
 * `head-base-base-head`. The job sets it so that half the jobs lead with each.
 */
export const PAIRED_ORDER = 'BENCHMARK_PAIRED_ORDER';

/** The base build's `dist` directory, the one holding `chrome/`. */
export const PAIRED_BASE_DIST = 'BENCHMARK_PAIRED_BASE_DIST';

/** The head build's `dist` directory, the one holding `chrome/`. */
export const PAIRED_HEAD_DIST = 'BENCHMARK_PAIRED_HEAD_DIST';

export const PAIRED_ORDERS = [
  'base-head-head-base',
  'head-base-base-head',
] as const;

export type PairedOrder = (typeof PAIRED_ORDERS)[number];

export type PairedBuild = 'base' | 'head';

/** A warm-up run, discarded, or a measured run. */
export type PairedPhase = 'warmup' | 'measured';

export type PairedConfig = {
  order: PairedOrder;
  /** Absolute path of each build's `dist` directory. */
  dist: Record<PairedBuild, string>;
};

/** One run of a paired job: `error` is why it gave no values; unmerged result keys stay here. */
export type PairingRun = {
  build: PairedBuild;
  position: number;
  error?: string;
  [key: string]: unknown;
};

/**
 * The `pairing` key of a paired job's results. `runs` lists the measured runs
 * only, `position` 0 to 3 in the order they ran; `warmup` lists the warm-up
 * runs, `position` 0 and 1 in the order they ran.
 */
export type Pairing = {
  order: PairedOrder;
  warmup: PairingRun[];
  runs: PairingRun[];
};

/** An iteration's value in a paired job, with the build and the run it came from. */
export type PairedMetricSample = MetricSample & {
  build: PairedBuild;
  position: number;
};

export type PairedBenchmarkResults = BenchmarkResults & {
  pairing: Pairing;
  /** The base build's observations, in the shape of `values`. */
  baseValues?: Record<string, PairedMetricSample[]>;
  [key: string]: unknown;
};

/** What one run gave: its results, or why it gave none. */
export type PairedRunOutcome = {
  build: PairedBuild;
  position: number;
  result?: BenchmarkResults & Record<string, unknown>;
  error?: string;
};

/** Every run of a paired job, warm-up and measured, each in the order it ran. */
export type PairedJobOutcomes = {
  warmup: PairedRunOutcome[];
  runs: PairedRunOutcome[];
};

/**
 * What one run of a paired job runs: the flow's iterations, or for a startup
 * flow one startup run of `browserLoads` browser loads of `pageLoads` page
 * loads each, which the flow iterates itself.
 */
export type PairedRunPlan =
  | { kind: 'iterations'; iterations: number }
  | { kind: 'startup'; browserLoads: number; pageLoads: number };

/** Iteration numbers one run spans; a startup run counts its discarded first browser load. */
export function pairedIterationsPerRun(plan: PairedRunPlan): number {
  return plan.kind === 'startup'
    ? plan.browserLoads * plan.pageLoads
    : plan.iterations;
}

/** The runner's arguments for one run, executed unpaired in its own process. */
export function pairedRunArguments({
  filePath,
  plan,
  retries,
  out,
  preset,
}: {
  filePath: string;
  plan: PairedRunPlan;
  retries: number;
  out: string;
  preset?: string;
}): string[] {
  const shape =
    plan.kind === 'startup'
      ? [
          '--browserLoads',
          String(plan.browserLoads),
          '--pageLoads',
          String(plan.pageLoads),
        ]
      : ['--iterations', String(plan.iterations)];
  return [
    filePath,
    ...shape,
    '--retries',
    String(retries),
    '--out',
    out,
    ...(preset ? ['--preset', preset] : []),
  ];
}

/**
 * Chrome only: Firefox caches its `.xpi` by `dist/firefox` path and manifest hash, so the
 * second build would reuse the first build's archive.
 */
export function readPairedConfig(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): PairedConfig {
  const browser = env.SELENIUM_BROWSER ?? 'chrome';
  if (browser !== 'chrome') {
    throw new Error(
      `${PAIRED}=1 runs on Chrome only, not ${browser}: Firefox reuses an .xpi cached by the path of dist/firefox and its manifest's hash, so the second build could run the first build's archive`,
    );
  }

  const order = env[PAIRED_ORDER] || PAIRED_ORDERS[0];
  if (!(PAIRED_ORDERS as readonly string[]).includes(order)) {
    throw new Error(
      `${PAIRED_ORDER} is "${order}"; it must be one of ${PAIRED_ORDERS.join(', ')}`,
    );
  }

  const readDist = (name: string): string => {
    const value = env[name];
    if (!value) {
      throw new Error(`${PAIRED}=1 needs ${name}, a build's dist directory`);
    }
    const dist = path.resolve(cwd, value);
    if (!existsSync(path.join(dist, 'chrome', 'manifest.json'))) {
      throw new Error(
        `${name} is ${dist}, which holds no chrome/manifest.json; it must be a build's dist directory`,
      );
    }
    return dist;
  };

  return {
    order: order as PairedOrder,
    dist: {
      base: readDist(PAIRED_BASE_DIST),
      head: readDist(PAIRED_HEAD_DIST),
    },
  };
}

/**
 * @param order - A paired order.
 * @returns The build of each measured run, in the order they run.
 */
export function pairedSequence(order: PairedOrder): PairedBuild[] {
  return order.split('-') as PairedBuild[];
}

/** The warm-up runs: one of each build, in the order the measured runs first reach them. */
export function pairedWarmupSequence(order: PairedOrder): PairedBuild[] {
  return pairedSequence(order).slice(0, 2);
}

/** The job's environment without `BENCHMARK_PAIRED`, so each run is unpaired. */
export function pairedRunEnvironment(
  env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
  const runEnv = { ...env };
  delete runEnv[PAIRED];
  return runEnv;
}

/** What `dist` was before a paired job pointed it at a build. */
export type DistState =
  | { kind: 'absent' }
  | { kind: 'symlink'; target: string };

/** Whether `dist` is absent or a symlink; a real directory throws rather than being moved. */
export async function readDistState(link: string): Promise<DistState> {
  let stats;
  try {
    stats = await fs.lstat(link);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { kind: 'absent' };
    }
    throw error;
  }
  if (!stats.isSymbolicLink()) {
    throw new Error(
      `${link} is a real ${stats.isDirectory() ? 'directory' : 'file'}. A paired job points it at each build in turn by a symlink and will not move it: put the builds elsewhere and pass their paths in ${PAIRED_BASE_DIST} and ${PAIRED_HEAD_DIST}`,
    );
  }
  return { kind: 'symlink', target: await fs.readlink(link) };
}

/** Point `dist` at a build, replacing the symlink in one rename. */
export async function pointDistAt(link: string, target: string): Promise<void> {
  const temporary = `${link}.paired-${process.pid}`;
  await fs.rm(temporary, { force: true });
  await fs.symlink(target, temporary, 'dir');
  await fs.rename(temporary, link);
}

/** Put `dist` back as it was before the job. */
export async function restoreDistState(
  link: string,
  state: DistState,
): Promise<void> {
  if (state.kind === 'symlink') {
    await pointDistAt(link, state.target);
    return;
  }
  const current = await readDistState(link);
  if (current.kind === 'symlink') {
    await fs.unlink(link);
  }
}

/** Run the warm-up runs, then the measured runs, with `dist` at each run's build; `dist` is always restored. */
export async function runPairedRuns({
  config,
  distLink,
  runOne,
  env = process.env,
}: {
  config: PairedConfig;
  distLink: string;
  runOne: (
    build: PairedBuild,
    position: number,
    phase: PairedPhase,
    runEnv: NodeJS.ProcessEnv,
  ) => Promise<BenchmarkResults & Record<string, unknown>>;
  env?: NodeJS.ProcessEnv;
}): Promise<PairedJobOutcomes> {
  const before = await readDistState(distLink);
  const job: PairedJobOutcomes = { warmup: [], runs: [] };
  const phases: [PairedPhase, PairedBuild[], PairedRunOutcome[]][] = [
    ['warmup', pairedWarmupSequence(config.order), job.warmup],
    ['measured', pairedSequence(config.order), job.runs],
  ];
  try {
    for (const [phase, sequence, outcomes] of phases) {
      for (const [position, build] of sequence.entries()) {
        const label =
          phase === 'warmup'
            ? `paired warm-up run ${position}, discarded`
            : `paired run ${position} of ${config.order}`;
        await pointDistAt(distLink, config.dist[build]);
        console.log(
          `[benchmark] ${label}: the ${build} build, ${config.dist[build]}`,
        );
        try {
          outcomes.push({
            build,
            position,
            result: await runOne(
              build,
              position,
              phase,
              pairedRunEnvironment(env),
            ),
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : String(error);
          console.error(`[benchmark] ${label} failed: ${message}`);
          outcomes.push({ build, position, error: message });
        }
      }
    }
  } finally {
    await restoreDistState(distLink, before);
  }
  return job;
}

const IDENTITY_KEYS = [
  'testTitle',
  'persona',
  'benchmarkType',
  'platform',
  'buildType',
] as const;

/** Keys the merge builds itself, from the head build's values. */
const SUMMARY_KEYS = new Set<string>([
  'mean',
  'min',
  'max',
  'stdDev',
  'p75',
  'p95',
  'trimmedCount',
  'outliers',
]);

type IterationRecord = { iteration: number } & Record<string, unknown>;

function isIterationEntries(value: unknown): value is IterationRecord[] {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) => isPlainObject(entry) && typeof entry.iteration === 'number',
    )
  );
}

/** Whether a results key is `{ [series]: Array<{ iteration, ... }> }`, the shape of `values`. */
function isPerIterationRecord(
  value: unknown,
): value is Record<string, IterationRecord[]> {
  return (
    isPlainObject(value) &&
    Object.keys(value).length > 0 &&
    Object.values(value).every(isIterationEntries)
  );
}

/**
 * Number a run's entries within the job and tag them with build and position;
 * `webVitals.runs` gets `build` only, since loaders read every numeric key there as a series.
 */
function tagIterations<TEntry extends IterationRecord>(
  entries: TEntry[],
  outcome: PairedRunOutcome,
  offset: number,
  withPosition = true,
): (TEntry & { build: PairedBuild; position?: number })[] {
  return entries.map((entry) => ({
    ...entry,
    iteration: offset + entry.iteration,
    build: outcome.build,
    ...(withPosition && { position: outcome.position }),
  }));
}

/**
 * The head build's statistics as `runBenchmarkWithIterations` computes them, except that every
 * timer but `total` may be 0: results do not record which timers carry a unit. A page load that
 * recorded no value (no hero mark, say) is left out, as the startup runner leaves it out.
 */
function headTimerStatistics(
  values: Record<string, PairedMetricSample[]>,
): TimerStatistics[] {
  return Object.entries(values).map(([id, entries]) => {
    const samples = entries.filter((sample) => Number.isFinite(sample.value));
    return calculateTimerStatistics(
      id,
      samples.map((sample) => sample.value),
      {
        iterations: samples.map((sample) => sample.iteration),
        ...(id === 'total'
          ? { maxDurationMs: MAX_TOTAL_DURATION_MS }
          : { minDurationMs: 0 }),
      },
    );
  });
}

/** Why a run gave no values; the runner writes an entry without `values` when every iteration failed. */
function runError(outcome: PairedRunOutcome): string | undefined {
  const reported = outcome.error ?? outcome.result?.error;
  if (typeof reported === 'string') {
    return reported;
  }
  if (outcome.result && !isPerIterationRecord(outcome.result.values)) {
    return 'no iteration gave a value';
  }
  return undefined;
}

/**
 * Merge a paired job's runs: `values` is head only, `baseValues` base only, the statistics are
 * the head's, and run `position`'s iteration `i` is `position * iterationsPerRun + i`.
 */
export function mergePairedRuns({
  order,
  iterationsPerRun,
  warmup,
  runs,
  identity,
}: {
  order: PairedOrder;
  iterationsPerRun: number;
  warmup: PairedRunOutcome[];
  runs: PairedRunOutcome[];
  identity: Pick<
    BenchmarkResults,
    'testTitle' | 'persona' | 'platform' | 'buildType'
  >;
}): PairedBenchmarkResults {
  const byPosition = (a: PairedRunOutcome, b: PairedRunOutcome) =>
    a.position - b.position;
  const failures: string[] = [];

  const warmupEntries = [...warmup].sort(byPosition).map((outcome) => {
    const entry: PairingRun = {
      build: outcome.build,
      position: outcome.position,
    };
    const error = runError(outcome);
    if (error) {
      entry.error = error;
      failures.push(
        `warm-up run ${outcome.position} (${outcome.build}): ${error}`,
      );
    }
    return entry;
  });

  const measured = [...runs].sort(byPosition);
  const first = measured.find((outcome) => outcome.result)?.result;
  const merged: Record<string, Record<string, IterationRecord[]>> = {};
  const append = (key: string, series: string, entries: IterationRecord[]) => {
    merged[key] ??= {};
    merged[key][series] = [...(merged[key][series] ?? []), ...entries];
  };
  const headWebVitalsRuns: WebVitalsRun[] = [];
  const runEntries: PairingRun[] = [];

  for (const outcome of measured) {
    const run: PairingRun = {
      build: outcome.build,
      position: outcome.position,
    };
    const offset = outcome.position * iterationsPerRun;
    const error = runError(outcome);
    if (error) {
      run.error = error;
      failures.push(`run ${outcome.position} (${outcome.build}): ${error}`);
    }
    for (const [key, value] of Object.entries(outcome.result ?? {})) {
      if (
        (IDENTITY_KEYS as readonly string[]).includes(key) ||
        SUMMARY_KEYS.has(key) ||
        key === 'error'
      ) {
        continue;
      }
      if (key === 'webVitals') {
        const entries = tagIterations(
          ((value as { runs?: WebVitalsRun[] }).runs ?? []) as (WebVitalsRun &
            IterationRecord)[],
          outcome,
          offset,
          false,
        );
        if (outcome.build === 'head') {
          headWebVitalsRuns.push(...entries);
        } else {
          run.webVitals = { runs: entries };
        }
      } else if (isPerIterationRecord(value)) {
        const target =
          key === 'values' && outcome.build === 'base' ? 'baseValues' : key;
        for (const [series, entries] of Object.entries(value)) {
          append(target, series, tagIterations(entries, outcome, offset));
        }
      } else {
        run[key] = value;
      }
    }
    runEntries.push(run);
  }

  const values = (merged.values ?? {}) as unknown as Record<
    string,
    PairedMetricSample[]
  >;
  const timers = headTimerStatistics(values);
  const webVitals =
    headWebVitalsRuns.length > 0
      ? {
          runs: headWebVitalsRuns,
          aggregated: aggregateWebVitals(headWebVitalsRuns),
        }
      : undefined;
  if (webVitals) {
    for (const key of WEB_VITALS_NUMERIC_KEYS) {
      const metric = webVitals.aggregated[key];
      if (metric) {
        timers.push(metric);
      }
    }
  }

  const summary = convertTimerStatisticsToBenchmarkResults(
    timers,
    first?.testTitle ?? identity.testTitle,
    first?.persona ?? identity.persona,
    first?.benchmarkType,
    first?.platform ?? identity.platform,
    first?.buildType ?? identity.buildType,
    webVitals,
  );
  // The statistics carry the head's values without `build` and `position`;
  // the tagged ones replace them.
  const { values: _untagged, ...statistics } = summary;

  return {
    ...statistics,
    ...merged,
    pairing: { order, warmup: warmupEntries, runs: runEntries },
    ...(failures.length > 0 && {
      error: `paired job incomplete: ${failures.join('; ')}`,
    }),
  };
}
