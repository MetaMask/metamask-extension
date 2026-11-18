import { ADMITTED_SERIES } from '../../test/e2e/benchmarks/utils/admitted-series';
import { makeShiftedFlowResults } from '../../test/e2e/benchmarks/utils/fixtures/paired-results';
import type { PairedOrder } from '../../test/e2e/benchmarks/utils/paired';
import {
  driftIssue,
  driftIssueTitle,
  driftSlackPayload,
  findDrifts,
  parseDriftState,
  toDriftState,
  type DriftSeriesResult,
  type DriftState,
} from './benchmark-drift';
import { evaluatePairedGate } from './paired-gate';

const REFERENCE = 'a'.repeat(40);
const SERIES = 'bridgeUserActions.bridge_load_page';
const OTHER = 'loadNewAccount.load_new_account';

const BLOCK: DriftSeriesResult = {
  verdict: 'block',
  shiftMs: 80,
  lowerMs: 60,
  deltaBlockMs: 33,
};
const NO_BLOCK: DriftSeriesResult = {
  verdict: 'no-block',
  shiftMs: 5,
  lowerMs: -10,
  deltaBlockMs: 33,
};

const run = (
  number: number,
  series: Record<string, DriftSeriesResult>,
  referenceSha = REFERENCE,
): DriftState => ({
  referenceSha,
  headSha: String(number).repeat(40).slice(0, 40),
  runUrl: `https://github.com/o/r/actions/runs/${number}`,
  series,
});

const drifted = (current: DriftState, previous?: DriftState) =>
  findDrifts(current, previous).map(({ series }) => series);

describe('findDrifts', () => {
  it('reports no drift on a first block', () => {
    expect(
      drifted(run(2, { [SERIES]: BLOCK }), run(1, { [SERIES]: NO_BLOCK })),
    ).toStrictEqual([]);
  });

  it('reports a drift on two consecutive blocks, with both runs', () => {
    const previous = run(1, { [SERIES]: BLOCK, [OTHER]: NO_BLOCK });
    const current = run(2, { [SERIES]: BLOCK, [OTHER]: BLOCK });

    expect(findDrifts(current, previous)).toStrictEqual([
      { series: SERIES, current: BLOCK, previous: BLOCK },
    ]);
  });

  it('resets on a block after a non-block', () => {
    const runs = [
      run(1, { [SERIES]: BLOCK }),
      run(2, { [SERIES]: NO_BLOCK }),
      run(3, { [SERIES]: BLOCK }),
      run(4, { [SERIES]: BLOCK }),
    ];

    expect(
      runs.slice(1).map((current, index) => drifted(current, runs[index])),
    ).toStrictEqual([[], [], [SERIES]]);
  });

  it('counts a missing previous state, or a series missing from it, as not blocked', () => {
    expect(drifted(run(2, { [SERIES]: BLOCK }))).toStrictEqual([]);
    expect(
      drifted(run(2, { [SERIES]: BLOCK }), run(1, { [OTHER]: BLOCK })),
    ).toStrictEqual([]);
  });

  it('counts only a block: inconclusive and incomplete runs reset', () => {
    for (const verdict of ['unable', 'incomplete'] as const) {
      const previous = run(1, { [SERIES]: { ...BLOCK, verdict } });

      expect(drifted(run(2, { [SERIES]: BLOCK }), previous)).toStrictEqual([]);
    }
  });

  it('ignores a previous run against another reference', () => {
    const previous = run(1, { [SERIES]: BLOCK }, 'b'.repeat(40));

    expect(drifted(run(2, { [SERIES]: BLOCK }), previous)).toStrictEqual([]);
  });
});

describe('parseDriftState', () => {
  it('reads back the state a run writes', () => {
    const state = run(1, { [SERIES]: BLOCK, [OTHER]: NO_BLOCK });

    expect(parseDriftState(JSON.parse(JSON.stringify(state)))).toStrictEqual(
      state,
    );
  });

  it('gives undefined for anything that is not a state', () => {
    for (const raw of [undefined, null, [], 'x', { referenceSha: 1 }]) {
      expect(parseDriftState(raw)).toBeUndefined();
    }
  });

  it('drops a malformed series entry', () => {
    const raw = {
      ...run(1, { [SERIES]: BLOCK }),
      series: { [SERIES]: BLOCK, [OTHER]: { verdict: 'block' } },
    };

    expect(parseDriftState(raw)?.series).toStrictEqual({ [SERIES]: BLOCK });
  });
});

describe('toDriftState', () => {
  const ORDERS: PairedOrder[] = ['base-head-head-base', 'head-base-base-head'];
  const ids = ADMITTED_SERIES.filter(({ series }) =>
    series.startsWith('loadNewAccount.'),
  ).map(({ series }) => series.slice('loadNewAccount.'.length));
  const jobs = (shift: number) =>
    [...ORDERS, ...ORDERS].map((order, index) => ({
      name: `benchmark-chrome-webpack-loadNewAccount-r${Math.floor(index / 2) + 1}-${order}`,
      data: { loadNewAccount: makeShiftedFlowResults(order, ids, shift) },
    }));
  const meta = { referenceSha: REFERENCE, headSha: 'h', runUrl: 'u' };

  it("records each series' verdict, shift and bound from the paired gate", () => {
    const state = toDriftState(evaluatePairedGate(jobs(200), true, true), meta);

    expect(state.series[OTHER]).toStrictEqual({
      verdict: 'block',
      shiftMs: 200,
      lowerMs: 200,
      deltaBlockMs: 50,
    });
    expect(state.series[SERIES].verdict).toBe('incomplete');
  });

  it('records no block for an unshifted head', () => {
    const state = toDriftState(evaluatePairedGate(jobs(0), true, true), meta);

    expect(state.series[OTHER].verdict).toBe('no-block');
  });
});

describe('the drift report', () => {
  const previous = run(1, { [SERIES]: { ...BLOCK, shiftMs: 70, lowerMs: 50 } });
  const current = run(2, { [SERIES]: BLOCK });
  const [drift] = findDrifts(current, previous);

  it("names the series, both runs' shift and bound, and both builds", () => {
    const issue = driftIssue(drift, current, previous);

    expect(issue.title).toBe(driftIssueTitle(SERIES));
    expect(issue.title).toBe(`Benchmark drift: ${SERIES}`);
    for (const text of [
      SERIES,
      '80.0 ms | 60.0 ms',
      '70.0 ms | 50.0 ms',
      'δ_block (33.0 ms)',
      REFERENCE,
      current.headSha,
      previous.headSha,
      current.runUrl,
      previous.runUrl,
    ]) {
      expect(issue.body).toContain(text);
    }
  });

  it('posts one Slack message for all drifts, and nothing without one', () => {
    const payload = driftSlackPayload([drift, drift], current, 'issues-url');

    expect(payload?.text.split('\n')).toHaveLength(4);
    expect(payload?.text).toContain(
      `\`${SERIES}\`: shift 80.0 ms, lower bound 60.0 ms against δ_block 33.0 ms`,
    );
    expect(payload?.text).toContain('<issues-url|Drift issues>');
    expect(driftSlackPayload([], current, 'issues-url')).toBeUndefined();
  });
});
