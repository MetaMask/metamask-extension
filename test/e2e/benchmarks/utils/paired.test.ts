import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'fs';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import type { BenchmarkResults } from '../../../../shared/constants/benchmarks';
import {
  PAIRED,
  PAIRED_BASE_DIST,
  PAIRED_HEAD_DIST,
  PAIRED_ORDER,
  mergePairedRuns,
  pairedIterationsPerRun,
  pairedRunArguments,
  pairedRunEnvironment,
  pairedSequence,
  pairedWarmupSequence,
  pointDistAt,
  readDistState,
  readPairedConfig,
  restoreDistState,
  runPairedRuns,
} from './paired';
import type { PairedMetricSample, PairedRunOutcome } from './paired';

/** A directory laid out like a build's `dist`, its manifest naming the build. */
function makeDist(root: string, name: string): string {
  const dist = path.join(root, name, 'dist');
  mkdirSync(path.join(dist, 'chrome'), { recursive: true });
  writeFileSync(
    path.join(dist, 'chrome', 'manifest.json'),
    JSON.stringify({ name }),
  );
  return dist;
}

/** One run's results entry, as an unpaired run of the runner writes it. */
function runResult(
  values: Record<string, { iteration: number; value: number }[]>,
  extra: Record<string, unknown> = {},
): BenchmarkResults & Record<string, unknown> {
  return {
    testTitle: 'benchmark-user-actions-confirm-tx',
    persona: 'standard',
    benchmarkType: 'userAction',
    platform: 'chrome',
    buildType: 'webpack',
    mean: {},
    min: {},
    max: {},
    stdDev: {},
    p75: {},
    p95: {},
    ...(Object.keys(values).length > 0 && { values }),
    ...extra,
  } as BenchmarkResults & Record<string, unknown>;
}

/**
 * Three iterations of `confirm_tx`.
 *
 * @param base - The first iteration's value; the others add 10 and 20.
 */
function threeIterations(base: number) {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    confirm_tx: [
      { iteration: 0, value: base },
      { iteration: 1, value: base + 10 },
      { iteration: 2, value: base + 20 },
    ],
  };
}

const IDENTITY = {
  testTitle: 'benchmark-user-actions-confirm-tx',
  persona: 'standard' as const,
  platform: 'chrome',
  buildType: 'webpack',
};

describe('readPairedConfig', () => {
  let root: string;
  let env: NodeJS.ProcessEnv;

  beforeEach(() => {
    root = mkdtempSync(path.join(os.tmpdir(), 'paired-config-'));
    makeDist(root, 'base');
    makeDist(root, 'head');
    env = {
      [PAIRED]: '1',
      [PAIRED_BASE_DIST]: 'base/dist',
      [PAIRED_HEAD_DIST]: path.join(root, 'head', 'dist'),
    };
  });

  it('defaults to base, head, head, base and resolves each dist against the working directory', () => {
    expect(readPairedConfig(env, root)).toStrictEqual({
      order: 'base-head-head-base',
      dist: {
        base: path.join(root, 'base', 'dist'),
        head: path.join(root, 'head', 'dist'),
      },
    });
  });

  it('takes head, base, base, head when the job asks for it', () => {
    expect(
      readPairedConfig({ ...env, [PAIRED_ORDER]: 'head-base-base-head' }, root)
        .order,
    ).toBe('head-base-base-head');
  });

  it('refuses any other order', () => {
    expect(() =>
      readPairedConfig({ ...env, [PAIRED_ORDER]: 'base-head' }, root),
    ).toThrow(
      'BENCHMARK_PAIRED_ORDER is "base-head"; it must be one of base-head-head-base, head-base-base-head',
    );
  });

  it('refuses a missing dist', () => {
    expect(() =>
      readPairedConfig({ ...env, [PAIRED_HEAD_DIST]: undefined }, root),
    ).toThrow('BENCHMARK_PAIRED=1 needs BENCHMARK_PAIRED_HEAD_DIST');
  });

  it('refuses a dist that holds no chrome build', () => {
    expect(() =>
      readPairedConfig({ ...env, [PAIRED_BASE_DIST]: 'base' }, root),
    ).toThrow(/holds no chrome\/manifest\.json/u);
  });

  it('refuses Firefox', () => {
    expect(() =>
      readPairedConfig({ ...env, SELENIUM_BROWSER: 'firefox' }, root),
    ).toThrow(/runs on Chrome only, not firefox/u);
  });
});

describe('pairedSequence', () => {
  it('gives each run its build, in order', () => {
    expect(pairedSequence('base-head-head-base')).toStrictEqual([
      'base',
      'head',
      'head',
      'base',
    ]);
    expect(pairedSequence('head-base-base-head')).toStrictEqual([
      'head',
      'base',
      'base',
      'head',
    ]);
  });

  it('warms up each build in the order the measured runs first reach it', () => {
    expect(pairedWarmupSequence('base-head-head-base')).toStrictEqual([
      'base',
      'head',
    ]);
    expect(pairedWarmupSequence('head-base-base-head')).toStrictEqual([
      'head',
      'base',
    ]);
  });
});

describe('pairedRunEnvironment', () => {
  it('drops BENCHMARK_PAIRED so the run is unpaired, keeps the rest, and leaves the job’s environment as it was', () => {
    const env = {
      [PAIRED]: '1',
      [PAIRED_ORDER]: 'head-base-base-head',
      X: 'y',
    };

    expect(pairedRunEnvironment(env)).toStrictEqual({
      [PAIRED_ORDER]: 'head-base-base-head',
      X: 'y',
    });
    expect(env[PAIRED]).toBe('1');
  });
});

describe('dist state', () => {
  let root: string;
  let link: string;
  let baseDist: string;
  let headDist: string;

  beforeEach(() => {
    root = mkdtempSync(path.join(os.tmpdir(), 'paired-dist-'));
    link = path.join(root, 'dist');
    baseDist = makeDist(root, 'base');
    headDist = makeDist(root, 'head');
  });

  it('points an absent dist at a build, repoints it, and removes it again', async () => {
    const before = await readDistState(link);
    expect(before).toStrictEqual({ kind: 'absent' });

    await pointDistAt(link, baseDist);
    expect(
      readFileSync(path.join(link, 'chrome', 'manifest.json'), 'utf8'),
    ).toBe('{"name":"base"}');
    await pointDistAt(link, headDist);
    expect(
      readFileSync(path.join(link, 'chrome', 'manifest.json'), 'utf8'),
    ).toBe('{"name":"head"}');

    await restoreDistState(link, before);
    expect(await readDistState(link)).toStrictEqual({ kind: 'absent' });
    expect(await fs.readdir(root)).toStrictEqual(['base', 'head']);
  });

  it('puts back a dist that was already a symlink', async () => {
    await fs.symlink(headDist, link, 'dir');
    const before = await readDistState(link);
    expect(before).toStrictEqual({ kind: 'symlink', target: headDist });

    await pointDistAt(link, baseDist);
    await restoreDistState(link, before);
    expect(await fs.readlink(link)).toBe(headDist);
  });

  it('refuses a dist that is a real directory, and leaves it alone', async () => {
    mkdirSync(path.join(link, 'chrome'), { recursive: true });
    await expect(readDistState(link)).rejects.toThrow(
      /is a real directory\. A paired job points it at each build in turn by a symlink and will not move it/u,
    );
    expect((await fs.lstat(link)).isDirectory()).toBe(true);
  });
});

describe('runPairedRuns', () => {
  let root: string;
  let link: string;
  let config: Parameters<typeof runPairedRuns>[0]['config'];

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    root = mkdtempSync(path.join(os.tmpdir(), 'paired-runs-'));
    link = path.join(root, 'dist');
    config = {
      order: 'base-head-head-base',
      dist: { base: makeDist(root, 'base'), head: makeDist(root, 'head') },
    };
  });

  /** A run that records which build `dist` points at, read as `webdriver/chrome.js` reads it. */
  function recordingRun(seen: string[]) {
    return async (build: string, position: number, phase: string) => {
      const manifest = JSON.parse(
        readFileSync(path.join(link, 'chrome', 'manifest.json'), 'utf8'),
      );
      seen.push(`${phase} ${position}:${build}:${manifest.name}`);
      return runResult({});
    };
  }

  it('runs a warm-up run of each build, then base, head, head, base, with dist at each run’s build, then removes dist', async () => {
    const seen: string[] = [];
    const job = await runPairedRuns({
      config,
      distLink: link,
      runOne: recordingRun(seen),
    });

    expect(seen).toStrictEqual([
      'warmup 0:base:base',
      'warmup 1:head:head',
      'measured 0:base:base',
      'measured 1:head:head',
      'measured 2:head:head',
      'measured 3:base:base',
    ]);
    expect(
      job.warmup.map(({ build, position }) => [build, position]),
    ).toStrictEqual([
      ['base', 0],
      ['head', 1],
    ]);
    expect(
      job.runs.map(({ build, position }) => [build, position]),
    ).toStrictEqual([
      ['base', 0],
      ['head', 1],
      ['head', 2],
      ['base', 3],
    ]);
    expect(await readDistState(link)).toStrictEqual({ kind: 'absent' });
  });

  it('warms up and runs head first when the job leads with head', async () => {
    const seen: string[] = [];
    await runPairedRuns({
      config: { ...config, order: 'head-base-base-head' },
      distLink: link,
      runOne: recordingRun(seen),
    });

    expect(seen).toStrictEqual([
      'warmup 0:head:head',
      'warmup 1:base:base',
      'measured 0:head:head',
      'measured 1:base:base',
      'measured 2:base:base',
      'measured 3:head:head',
    ]);
  });

  it('records a run that throws, goes on, and still puts dist back', async () => {
    await fs.symlink(config.dist.head, link, 'dir');
    const job = await runPairedRuns({
      config,
      distLink: link,
      runOne: async (_build, position, phase) => {
        if (phase === 'measured' && position === 1) {
          throw new Error('the run crashed');
        }
        return runResult({});
      },
      env: {},
    });

    expect(job.runs[1]).toStrictEqual({
      build: 'head',
      position: 1,
      error: 'the run crashed',
    });
    expect(job.runs.filter((outcome) => outcome.result)).toHaveLength(3);
    expect(job.warmup.filter((outcome) => outcome.result)).toHaveLength(2);
    expect(await fs.readlink(link)).toBe(config.dist.head);
  });

  it('starts every run, warm-up runs too, unpaired and with the rest of the job’s environment', async () => {
    const given: NodeJS.ProcessEnv[] = [];
    const env = { [PAIRED]: '1', X: 'y' };
    await runPairedRuns({
      config,
      distLink: link,
      runOne: async (_build, _position, _phase, runEnv) => {
        given.push(runEnv);
        return runResult({});
      },
      env,
    });

    expect(given).toHaveLength(6);
    expect(given.every((runEnv) => runEnv.X === 'y')).toBe(true);
    expect(given.some((runEnv) => PAIRED in runEnv)).toBe(false);
    expect(env).toStrictEqual({ [PAIRED]: '1', X: 'y' });
  });
});

describe('pairedRunArguments', () => {
  it('runs an iterated flow for its iterations, with the retries and where to write', () => {
    const plan = { kind: 'iterations', iterations: 5 } as const;
    expect(
      pairedRunArguments({
        filePath: 'test/e2e/benchmarks/flows/interaction/load-new-account.ts',
        plan,
        retries: 2,
        out: 'run.json',
      }),
    ).toStrictEqual([
      'test/e2e/benchmarks/flows/interaction/load-new-account.ts',
      '--iterations',
      '5',
      '--retries',
      '2',
      '--out',
      'run.json',
    ]);
    expect(pairedIterationsPerRun(plan)).toBe(5);
  });

  it('runs a startup flow as one startup run of its browser loads of page loads, with no --iterations', () => {
    const plan = { kind: 'startup', browserLoads: 4, pageLoads: 10 } as const;
    expect(
      pairedRunArguments({
        filePath: 'test/e2e/benchmarks/flows/startup/standard-home.ts',
        plan,
        retries: 2,
        out: 'run.json',
      }),
    ).toStrictEqual([
      'test/e2e/benchmarks/flows/startup/standard-home.ts',
      '--browserLoads',
      '4',
      '--pageLoads',
      '10',
      '--retries',
      '2',
      '--out',
      'run.json',
    ]);
    // The discarded first browser load is numbered too.
    expect(pairedIterationsPerRun(plan)).toBe(40);
  });

  it('passes the preset on when the job has one', () => {
    expect(
      pairedRunArguments({
        filePath: 'flow.ts',
        plan: { kind: 'iterations', iterations: 3 },
        retries: 0,
        out: 'run.json',
        preset: 'interactionUserActions',
      }).slice(-2),
    ).toStrictEqual(['--preset', 'interactionUserActions']);
  });
});

describe('mergePairedRuns', () => {
  /** Warm-up runs read 900 and up, so any of their values that leaked would show. */
  const WARMUP_VALUE = 900;

  /** A base, head, head, base job: two warm-up runs and four measured runs; base reads 100s, head 200s. */
  function job(
    extra: (position: number) => Record<string, unknown> = () => ({}),
  ): { warmup: PairedRunOutcome[]; runs: PairedRunOutcome[] } {
    return {
      warmup: (['base', 'head'] as const).map((build, position) => ({
        build,
        position,
        result: runResult(threeIterations(WARMUP_VALUE + position), {
          stepTerms: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            confirm_tx: [{ iteration: 1, stepWork: WARMUP_VALUE }],
          },
        }),
      })),
      runs: pairedSequence('base-head-head-base').map((build, position) => ({
        build,
        position,
        result: runResult(
          threeIterations(build === 'base' ? 100 : 200),
          extra(position),
        ),
      })),
    };
  }

  function merge(outcomes = job()) {
    return mergePairedRuns({
      order: 'base-head-head-base',
      iterationsPerRun: 3,
      ...outcomes,
      identity: IDENTITY,
    });
  }

  it('puts the head build’s iterations in values and the base build’s in baseValues, each with its run', () => {
    const merged = merge();
    const head = merged.values?.confirm_tx as PairedMetricSample[];
    const base = merged.baseValues?.confirm_tx as PairedMetricSample[];

    expect(
      head.map(({ iteration, value, build, position }) => [
        iteration,
        value,
        build,
        position,
      ]),
    ).toStrictEqual([
      [3, 200, 'head', 1],
      [4, 210, 'head', 1],
      [5, 220, 'head', 1],
      [6, 200, 'head', 2],
      [7, 210, 'head', 2],
      [8, 220, 'head', 2],
    ]);
    expect(
      base.map(({ iteration, value, build, position }) => [
        iteration,
        value,
        build,
        position,
      ]),
    ).toStrictEqual([
      [0, 100, 'base', 0],
      [1, 110, 'base', 0],
      [2, 120, 'base', 0],
      [9, 100, 'base', 3],
      [10, 110, 'base', 3],
      [11, 120, 'base', 3],
    ]);
  });

  it('records the warm-up runs under pairing.warmup, not in runs, and keeps none of their values', () => {
    const merged = merge();

    expect(merged.pairing).toStrictEqual({
      order: 'base-head-head-base',
      warmup: [
        { build: 'base', position: 0 },
        { build: 'head', position: 1 },
      ],
      runs: [0, 1, 2, 3].map((position) => ({
        build: position === 0 || position === 3 ? 'base' : 'head',
        position,
      })),
    });
    const kept = [
      ...(merged.values?.confirm_tx as PairedMetricSample[]),
      ...(merged.baseValues?.confirm_tx as PairedMetricSample[]),
    ].map((sample) => sample.value);
    expect(kept.filter((value) => value >= WARMUP_VALUE)).toStrictEqual([]);
    expect(kept).toHaveLength(12);
    // Only the warm-up runs carried stepTerms.
    expect(merged.stepTerms).toBeUndefined();
    expect(merged.error).toBeUndefined();
  });

  it('gives the head build’s statistics alone', () => {
    const merged = merge();

    // Head's values: 200, 210, 220, 200, 210, 220.
    expect(merged.mean.confirm_tx).toBe(210);
    expect(merged.min.confirm_tx).toBe(200);
    expect(merged.max.confirm_tx).toBe(220);
    expect(merged.testTitle).toBe('benchmark-user-actions-confirm-tx');
    expect(merged.platform).toBe('chrome');
  });

  it('lets a timer read 0 in the head statistics, as a timer with a unit may', () => {
    const outcomes = job();
    for (const outcome of outcomes.runs) {
      outcome.result = runResult({
        tbt: [
          { iteration: 0, value: 0 },
          { iteration: 1, value: 0 },
          { iteration: 2, value: 0 },
        ],
      });
    }
    const merged = merge(outcomes);

    expect(merged.mean.tbt).toBe(0);
    expect(merged.outliers?.tbt).toBe(0);
  });

  it('leaves a page load with no value out of the head statistics, whether its value was NaN or dropped', () => {
    const outcomes = job();
    for (const outcome of outcomes.runs) {
      outcome.result = runResult({
        heroPainted: [
          { iteration: 0, value: 300 },
          { iteration: 1, value: Number.NaN },
          { iteration: 2 } as unknown as PairedMetricSample,
        ],
      });
    }
    const merged = merge(outcomes);

    expect(merged.mean.heroPainted).toBe(300);
    expect(merged.p75?.heroPainted).toBe(300);
  });

  it('merges other per-iteration records across both builds, each entry with its build and run, and leaves any other key on its run', () => {
    const merged = merge(
      job((position) => ({
        stepTerms: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          confirm_tx: [{ iteration: 2, stepWork: position }],
        },
        unknownKey: { position },
      })),
    );

    expect(merged.stepTerms).toStrictEqual({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      confirm_tx: [
        { iteration: 2, stepWork: 0, build: 'base', position: 0 },
        { iteration: 5, stepWork: 1, build: 'head', position: 1 },
        { iteration: 8, stepWork: 2, build: 'head', position: 2 },
        { iteration: 11, stepWork: 3, build: 'base', position: 3 },
      ],
    });
    expect(merged.pairing.runs.map((run) => run.unknownKey)).toStrictEqual(
      [0, 1, 2, 3].map((position) => ({ position })),
    );
  });

  it('numbers a run after the previous run’s last iteration even when that iteration failed', () => {
    const outcomes = job();
    outcomes.runs[0].result = runResult({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      confirm_tx: [
        { iteration: 0, value: 100 },
        { iteration: 1, value: 110 },
      ],
    });
    const base = merge(outcomes).baseValues?.confirm_tx as PairedMetricSample[];

    expect(base.map((sample) => sample.iteration)).toStrictEqual([
      0, 1, 9, 10, 11,
    ]);
  });

  it('gives web vitals of the head build alone at the top, with no numeric key a loader would read as a series, and keeps each base run’s on its run', () => {
    const vitals = (inp: number, iteration: number) => ({
      iteration,
      inp,
      fcp: null,
      lcp: null,
      cls: null,
      inpRating: 'good',
      fcpRating: null,
      lcpRating: null,
      clsRating: null,
    });
    const merged = merge(
      job((position) => {
        const inp = position === 0 || position === 3 ? 40 : 80;
        return {
          webVitals: {
            runs: [vitals(inp, 0), vitals(inp, 1), vitals(inp, 2)],
            aggregated: {},
          },
        };
      }),
    );

    const webVitals = merged.webVitals as NonNullable<
      BenchmarkResults['webVitals']
    >;
    expect(webVitals.runs).toHaveLength(6);
    expect(webVitals.runs[0]).toStrictEqual({
      iteration: 3,
      inp: 80,
      fcp: null,
      lcp: null,
      cls: null,
      inpRating: 'good',
      fcpRating: null,
      lcpRating: null,
      clsRating: null,
      build: 'head',
    });
    expect(webVitals.aggregated.inp?.mean).toBe(80);
    expect(webVitals.aggregated.ratings.inp.good).toBe(6);
    expect(merged.mean.inp).toBe(80);
    expect(
      (
        merged.pairing.runs[0].webVitals as { runs: { inp: number }[] }
      ).runs.map((run) => run.inp),
    ).toStrictEqual([40, 40, 40]);
  });

  it('names the runs that gave no values, warm-up runs too, and keeps the rest', () => {
    const outcomes = job();
    outcomes.warmup[1] = { build: 'head', position: 1, error: 'no build' };
    outcomes.runs[2] = { build: 'head', position: 2, error: 'the run crashed' };
    outcomes.runs[3].result = runResult({}, { error: 'flow failed to load' });
    const merged = merge(outcomes);

    expect(merged.error).toBe(
      'paired job incomplete: warm-up run 1 (head): no build; run 2 (head): the run crashed; run 3 (base): flow failed to load',
    );
    expect(merged.pairing.warmup[1]).toStrictEqual({
      build: 'head',
      position: 1,
      error: 'no build',
    });
    expect(merged.pairing.runs[2]).toStrictEqual({
      build: 'head',
      position: 2,
      error: 'the run crashed',
    });
    expect(merged.values?.confirm_tx).toHaveLength(3);
    expect(merged.baseValues?.confirm_tx).toHaveLength(3);
    expect(merged.mean.confirm_tx).toBe(210);
  });

  it('reports a run whose iterations all failed, which the runner writes without values', () => {
    const outcomes = job();
    outcomes.runs[1].result = runResult({});
    const merged = merge(outcomes);

    expect(merged.error).toBe(
      'paired job incomplete: run 1 (head): no iteration gave a value',
    );
    expect(merged.pairing.runs[1]).toStrictEqual({
      build: 'head',
      position: 1,
      error: 'no iteration gave a value',
    });
    expect(merged.values?.confirm_tx).toHaveLength(3);
  });

  it('falls back to the flow’s identity when no run gave results', () => {
    const failed = (order: 'head-base-base-head') => ({
      warmup: pairedWarmupSequence(order).map((build, position) => ({
        build,
        position,
        error: 'no build',
      })),
      runs: pairedSequence(order).map((build, position) => ({
        build,
        position,
        error: 'no build',
      })),
    });
    const merged = mergePairedRuns({
      order: 'head-base-base-head',
      iterationsPerRun: 3,
      ...failed('head-base-base-head'),
      identity: IDENTITY,
    });

    expect(merged.testTitle).toBe(IDENTITY.testTitle);
    expect(merged.values).toBeUndefined();
    expect(merged.baseValues).toBeUndefined();
    expect(merged.mean).toStrictEqual({});
    expect(merged.pairing.order).toBe('head-base-base-head');
    expect(merged.error).toMatch(
      /^paired job incomplete: warm-up run 0 \(head\): no build;/u,
    );
  });

  it('merges startup runs: page loads numbered across the job from each run’s first browser load, the discarded one included', () => {
    // A startup run of 2 browser loads of 2 page loads numbers 4 page loads
    // per run; the runner drops the first browser load's, so its `values`
    // start at iteration 2.
    const startupRun = (base: number) => ({
      uiStartup: [
        { iteration: 2, value: base },
        { iteration: 3, value: base + 1 },
      ],
    });
    const outcomes = {
      warmup: (['base', 'head'] as const).map((build, position) => ({
        build,
        position,
        result: runResult(startupRun(WARMUP_VALUE + position)),
      })),
      runs: pairedSequence('base-head-head-base').map((build, position) => ({
        build,
        position,
        result: runResult(startupRun(build === 'base' ? 100 : 200)),
      })),
    };
    const merged = mergePairedRuns({
      order: 'base-head-head-base',
      iterationsPerRun: pairedIterationsPerRun({
        kind: 'startup',
        browserLoads: 2,
        pageLoads: 2,
      }),
      ...outcomes,
      identity: IDENTITY,
    });

    expect(
      (merged.values?.uiStartup as PairedMetricSample[]).map(
        ({ iteration, value, build, position }) => [
          iteration,
          value,
          build,
          position,
        ],
      ),
    ).toStrictEqual([
      [6, 200, 'head', 1],
      [7, 201, 'head', 1],
      [10, 200, 'head', 2],
      [11, 201, 'head', 2],
    ]);
    expect(
      (merged.baseValues?.uiStartup as PairedMetricSample[]).map(
        ({ iteration, value }) => [iteration, value],
      ),
    ).toStrictEqual([
      [2, 100],
      [3, 101],
      [14, 100],
      [15, 101],
    ]);
    expect(merged.error).toBeUndefined();
  });
});
