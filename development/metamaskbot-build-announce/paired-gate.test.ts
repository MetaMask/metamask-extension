import { ADMITTED_SERIES } from '../../test/e2e/benchmarks/utils/gated-metrics';
import {
  makePairedFlowResults,
  makeShiftedFlowResults,
} from '../../test/e2e/benchmarks/utils/fixtures/paired-results';
import type { PairedOrder } from '../../test/e2e/benchmarks/utils/paired';
import {
  evaluatePairedGate,
  formatPairedOutcome,
  PAIRED_DIFFERENCES,
} from './paired-gate';

const BRIDGE_SERIES = ADMITTED_SERIES.filter(({ series }) =>
  series.startsWith('bridgeUserActions.'),
);
const BRIDGE_IDS = BRIDGE_SERIES.map(({ series }) =>
  series.slice('bridgeUserActions.'.length),
);
const ORDERS: PairedOrder[] = ['base-head-head-base', 'head-base-base-head'];

/** Two jobs of each order, as the workflow runs them: four jobs, eight differences. */
const fourJobs = (
  make: (order: PairedOrder) => Record<string, unknown>,
  flow = 'bridgeUserActions',
) =>
  [...ORDERS, ...ORDERS].map((order, index) => ({
    name: `benchmark-chrome-webpack-${flow}-r${Math.floor(index / 2) + 1}-${order}`,
    data: { [flow]: make(order) },
  }));

/** Four unshifted jobs for every flow with an admitted series. */
const everyFlowsJobs = () => {
  const idsByFlow = new Map<string, string[]>();
  for (const { series } of ADMITTED_SERIES) {
    const [flow, ...rest] = series.split('.');
    idsByFlow.set(flow, [...(idsByFlow.get(flow) ?? []), rest.join('.')]);
  }
  return [...idsByFlow].flatMap(([flow, ids]) =>
    fourJobs((order) => makeShiftedFlowResults(order, ids, 0), flow),
  );
};

describe('evaluatePairedGate', () => {
  it('forms head minus base for the pairs at positions (0, 1) and (2, 3), in either order', () => {
    const jobs = [
      ['base-head-head-base', [1000, 1100, 1250, 1180]],
      ['head-base-base-head', [1100, 1000, 1180, 1250]],
    ] as const;
    const benchmarks = [...jobs, ...jobs].map(([order, means], index) => ({
      name: `benchmark-chrome-webpack-bridgeUserActions-${order}-${index}`,
      data: {
        bridgeUserActions: makePairedFlowResults({
          order,
          runMeans: Object.fromEntries([['bridge_load_page', means]]),
        }),
      },
    }));

    const [outcome] = evaluatePairedGate(benchmarks).filter(
      ({ series }) => series === 'bridgeUserActions.bridge_load_page',
    );

    // The differences are 100 and 70, four of each: Walsh averages 70 (10),
    // 85 (16) and 100 (10), so the median is 85 and the 6th smallest is 70.
    expect(outcome.decision).toMatchObject({ n: 8, shift: 85, lower: 70 });
  });

  it('blocks when the lower bound exceeds δ_block', () => {
    const outcomes = evaluatePairedGate(
      fourJobs((order) => makeShiftedFlowResults(order, BRIDGE_IDS, 100)),
    );

    expect(outcomes).toHaveLength(BRIDGE_SERIES.length);
    for (const outcome of outcomes) {
      expect(outcome).toMatchObject({
        verdict: 'block',
        failed: true,
        source: 'chrome-webpack',
      });
      expect(outcome.decision).toMatchObject({ n: 8, lower: 100 });
    }
  });

  it('passes when the lower bound does not exceed δ_block', () => {
    const outcomes = evaluatePairedGate(
      fourJobs((order) => makeShiftedFlowResults(order, BRIDGE_IDS, 20)),
    );

    expect(outcomes.map(({ verdict }) => verdict)).toStrictEqual(
      BRIDGE_IDS.map(() => 'no-block'),
    );
    expect(outcomes.some(({ failed }) => failed)).toBe(false);
  });

  it('is inconclusive, and fails, with two jobs: four differences are too few for a bound', () => {
    const outcomes = evaluatePairedGate(
      fourJobs((order) => makeShiftedFlowResults(order, BRIDGE_IDS, 0)).slice(
        0,
        2,
      ),
    );

    for (const outcome of outcomes) {
      expect(outcome).toMatchObject({ verdict: 'unable', failed: true });
      expect(outcome.decision?.n).toBe(4);
      expect(formatPairedOutcome(outcome)).toContain('inconclusive');
    }
  });

  it('fails a leg whose result is only an error', () => {
    const outcomes = evaluatePairedGate([
      {
        name: 'benchmark-chrome-webpack-bridgeUserActions-base-head-head-base',
        data: { bridgeUserActions: { error: 'Error: driver exited' } },
      },
    ]);

    expect(outcomes).toHaveLength(BRIDGE_SERIES.length);
    for (const outcome of outcomes) {
      expect(outcome).toMatchObject({ verdict: 'incomplete', failed: true });
      expect(outcome.problems.join()).toContain('driver exited');
    }
  });

  it('fails a paired job that finished with an error beside its values', () => {
    const outcomes = evaluatePairedGate(
      fourJobs((order) => ({
        ...makeShiftedFlowResults(order, BRIDGE_IDS, 0),
        error: 'paired job incomplete: run 2 (head): timed out',
      })),
    );

    expect(outcomes.every(({ verdict }) => verdict === 'incomplete')).toBe(
      true,
    );
  });

  it('fails an admitted series a result has no values for', () => {
    const outcomes = evaluatePairedGate(
      fourJobs((order) =>
        makeShiftedFlowResults(
          order,
          BRIDGE_IDS.filter((id) => id !== 'tbt'),
          0,
        ),
      ),
    );

    const byVerdict = Object.fromEntries(
      outcomes.map(({ series, verdict }) => [series, verdict]),
    );
    expect(byVerdict['bridgeUserActions.tbt']).toBe('incomplete');
    expect(byVerdict['bridgeUserActions.bridge_load_page']).toBe('no-block');
  });

  it('fails a value tagged with the other build than its run', () => {
    const results = makeShiftedFlowResults(ORDERS[0], BRIDGE_IDS, 0) as {
      values: Record<string, { build: string }[]>;
    };
    results.values.tbt[0].build = 'base';

    const outcomes = evaluatePairedGate([
      {
        name: 'benchmark-chrome-webpack-bridgeUserActions-x',
        data: { bridgeUserActions: results },
      },
    ]);

    expect(
      outcomes.find(({ series }) => series === 'bridgeUserActions.tbt'),
    ).toMatchObject({ verdict: 'incomplete', failed: true });
  });

  it('does not block on a series without an admission verdict, however far it shifts', () => {
    const outcomes = evaluatePairedGate([
      ...fourJobs(
        (order) => makeShiftedFlowResults(order, ['confirm_tx'], 5000),
        'confirmTx',
      ),
      ...fourJobs((order) =>
        makeShiftedFlowResults(
          order,
          [...BRIDGE_IDS, 'bridge_unadmitted_step'],
          0,
        ),
      ),
    ]);

    expect(outcomes.some(({ failed }) => failed)).toBe(false);
    expect(outcomes.map(({ series }) => series)).not.toContain(
      'bridgeUserActions.bridge_unadmitted_step',
    );
    expect(outcomes.map(({ series }) => series)).not.toContain(
      'confirmTx.confirm_tx',
    );
  });

  it("fails an unpaired file's error in its own leg check", () => {
    const outcomes = evaluatePairedGate(
      [
        {
          name: 'benchmark-firefox-webpack-startupStandardHome',
          data: { startupStandardHome: { error: 'Error: x' } },
        },
      ],
      false,
    );

    expect(outcomes.length).toBeGreaterThan(0);
    expect(outcomes.every(({ failed }) => failed)).toBe(true);
  });

  it('leaves an unpaired file alone in the gate, errors included', () => {
    const unpaired = {
      name: 'benchmark-firefox-webpack-startupStandardHome',
      data: { startupStandardHome: { mean: {}, p75: {}, p95: {} } },
    };

    expect(evaluatePairedGate([unpaired])).toStrictEqual([]);
    expect(
      evaluatePairedGate([
        { ...unpaired, data: { startupStandardHome: { error: 'Error: x' } } },
      ]),
    ).toStrictEqual([]);
  });

  it('fails every admitted series of a paired job that carries an error', () => {
    const outcomes = evaluatePairedGate([
      {
        name: 'benchmark-chrome-webpack-startupStandardHome-r1-base-head-head-base',
        data: { startupStandardHome: { error: 'Error: x' } },
      },
    ]);

    expect(outcomes.length).toBeGreaterThan(0);
    expect(outcomes.every(({ failed }) => failed)).toBe(true);
  });

  it('checks completeness and defers the decision for one leg', () => {
    const [job] = fourJobs((order) =>
      makeShiftedFlowResults(order, BRIDGE_IDS, 500),
    );

    const outcomes = evaluatePairedGate([job], false);

    expect(outcomes.map(({ verdict }) => verdict)).toStrictEqual(
      BRIDGE_IDS.map(() => 'deferred'),
    );
    expect(outcomes.some(({ failed }) => failed)).toBe(false);
    expect(
      evaluatePairedGate(
        [{ ...job, data: { bridgeUserActions: { error: 'Error: x' } } }],
        false,
      ).every(({ failed }) => failed),
    ).toBe(true);
  });

  it('requires every job of every admitted series when the jobs ran paired', () => {
    const complete = everyFlowsJobs();
    expect(
      evaluatePairedGate(complete, true, true).some(({ failed }) => failed),
    ).toBe(false);

    const oneJobMissing = evaluatePairedGate(
      complete.filter(
        ({ name }) =>
          name !==
          'benchmark-chrome-webpack-assetDetails-r2-head-base-base-head',
      ),
      true,
      true,
    );
    expect(
      oneJobMissing.find(
        ({ series }) => series === 'assetDetails.assetClickToPriceChart',
      ),
    ).toMatchObject({
      verdict: 'incomplete',
      failed: true,
      problems: [
        `6 of ${PAIRED_DIFFERENCES} differences: a paired job's results are missing`,
      ],
    });

    const flowMissing = evaluatePairedGate(
      complete.filter(({ name }) => !name.includes('-loadNewAccount-')),
      true,
      true,
    );
    expect(
      flowMissing.find(
        ({ series }) => series === 'loadNewAccount.load_new_account',
      ),
    ).toMatchObject({ verdict: 'incomplete', failed: true });
  });

  it('decides only the flows it was given when the jobs did not run paired', () => {
    expect(
      evaluatePairedGate(
        fourJobs((order) => makeShiftedFlowResults(order, BRIDGE_IDS, 0)),
      ).some(({ failed }) => failed),
    ).toBe(false);
  });

  it('pools per browser and build type', () => {
    const outcomes = evaluatePairedGate([
      ...fourJobs((order) => makeShiftedFlowResults(order, BRIDGE_IDS, 0)),
      ...fourJobs((order) => makeShiftedFlowResults(order, BRIDGE_IDS, 0)).map(
        (job) => ({ ...job, name: job.name.replace('chrome', 'firefox') }),
      ),
    ]);

    expect(outcomes).toHaveLength(BRIDGE_SERIES.length * 2);
    expect(outcomes.every(({ decision }) => decision?.n === 8)).toBe(true);
  });

  describe('runs that do not alternate', () => {
    for (const order of ['base-base-head-head', 'head-head-base-base']) {
      it(`fails a job that ran ${order}, for the order and not for a missing value`, () => {
        const outcomes = evaluatePairedGate(
          fourJobs(() =>
            makeShiftedFlowResults(order as PairedOrder, BRIDGE_IDS, 0),
          ),
        );

        expect(outcomes).toHaveLength(BRIDGE_SERIES.length);
        for (const outcome of outcomes) {
          expect(outcome).toMatchObject({
            verdict: 'incomplete',
            failed: true,
          });
          expect(outcome.problems.join()).toContain('runs do not alternate');
          expect(outcome.problems.join()).not.toContain('retained value');
        }
      });
    }
  });

  describe('excluded iterations', () => {
    type Sample = { position: number; excluded?: boolean; excludedBy?: string };
    const samplesOf = (results: Record<string, unknown>, id: string) =>
      (results.values as Record<string, Sample[]>)[id];

    it('leaves an excluded iteration out of its run mean', () => {
      // Head runs hold 1095 and 1105 against base runs at 1000. Excluding each head
      // run's 1095, by either field, moves its mean to 1105 and every difference to 105.
      const outcomes = evaluatePairedGate(
        fourJobs((order) => {
          const results = makeShiftedFlowResults(order, BRIDGE_IDS, 100);
          for (const id of BRIDGE_IDS) {
            const seen = new Set<number>();
            for (const sample of samplesOf(results, id)) {
              if (!seen.has(sample.position)) {
                seen.add(sample.position);
                if (sample.position % 2 === 0) {
                  sample.excluded = true;
                } else {
                  sample.excludedBy = 'sanity';
                }
              }
            }
          }
          return results;
        }),
      );

      for (const outcome of outcomes) {
        expect(outcome.decision).toMatchObject({
          n: 8,
          shift: 105,
          lower: 105,
        });
      }
    });

    it('fails a series when every iteration of a run is excluded', () => {
      const [job, ...rest] = fourJobs((order) =>
        makeShiftedFlowResults(order, BRIDGE_IDS, 0),
      );
      const results = job.data.bridgeUserActions as Record<string, unknown>;
      for (const sample of samplesOf(results, 'tbt')) {
        sample.excluded = true;
      }

      const outcomes = evaluatePairedGate([job, ...rest]);

      const byId = Object.fromEntries(
        outcomes.map((outcome) => [outcome.series, outcome]),
      );
      expect(byId['bridgeUserActions.tbt']).toMatchObject({
        verdict: 'incomplete',
        failed: true,
      });
      expect(byId['bridgeUserActions.tbt'].problems.join()).toContain(
        'gave no retained value',
      );
      expect(byId['bridgeUserActions.bridge_load_page'].verdict).toBe(
        'no-block',
      );
    });
  });

  describe('page loads with no value', () => {
    const SERIES = 'startupStandardHome.heroPainted';
    // Head runs sit at 990 against base runs at 1000: faster, if their missing loads are ignored.
    const heroJobs = (
      missingHead: number | string,
      flow = 'startupStandardHome',
    ) =>
      [...ORDERS, ...ORDERS].map((order, index) => {
        const builds = order.split('-');
        const results = makePairedFlowResults({
          order,
          runMeans: {
            heroPainted: builds.map((build) =>
              build === 'head' ? 990 : 1000,
            ) as [number, number, number, number],
          },
          missingByRun: { heroPainted: [0, 0, 0, 0] },
        });
        const { runs } = results.pairing as {
          runs: { build: string; missingCount: object }[];
        };
        for (const run of runs) {
          if (run.build === 'head') {
            run.missingCount = { heroPainted: missingHead };
          }
        }
        return {
          name: `benchmark-chrome-webpack-${flow}-r${Math.floor(index / 2) + 1}-${order}`,
          data: { [flow]: results },
        };
      });
    const heroOutcome = (jobs: ReturnType<typeof heroJobs>) =>
      evaluatePairedGate(jobs).find(({ series }) => series === SERIES);

    it('passes when every run reports none missing', () => {
      expect(heroOutcome(heroJobs(0))).toMatchObject({
        verdict: 'no-block',
        failed: false,
      });
    });

    it('fails a series when a head run has a page load with no value, however fast the others are', () => {
      const outcome = heroOutcome(heroJobs(1));

      expect(outcome).toMatchObject({ verdict: 'incomplete', failed: true });
      expect(outcome?.problems.join()).toContain(
        '(head): 1 page load gave no "heroPainted" value',
      );
    });

    it('fails a series when a base run has a page load with no value', () => {
      const jobs = heroJobs(0);
      for (const job of jobs) {
        const { runs } = (
          job.data.startupStandardHome as {
            pairing: { runs: { build: string; missingCount: object }[] };
          }
        ).pairing;
        for (const run of runs) {
          if (run.build === 'base') {
            run.missingCount = { heroPainted: 2 };
          }
        }
      }

      expect(heroOutcome(jobs)?.problems.join()).toContain(
        '(base): 2 page loads gave no "heroPainted" value',
      );
    });

    it('fails a series whose missing count is not a count', () => {
      expect(heroOutcome(heroJobs('many'))).toMatchObject({
        verdict: 'incomplete',
        failed: true,
      });
    });
  });
});
