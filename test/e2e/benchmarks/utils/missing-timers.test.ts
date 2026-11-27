import { assertNoMissingTimers, findMissingTimers } from './missing-timers';
import { runBenchmarkWithIterations } from './runner';
import type { BenchmarkRunResult } from './types';

const STEP = 'bridge_load_page';

function run(
  timerIds: string[],
  expectedTimers: string[] = [STEP],
): BenchmarkRunResult {
  return {
    timers: timerIds.map((id) => ({ id, value: 100 })),
    expectedTimers,
    success: true,
  };
}

describe('findMissingTimers', () => {
  it('reports a timer no run produced', () => {
    const results = [run([`${STEP}Legacy`]), run([`${STEP}Legacy`])];

    expect(findMissingTimers(results)).toStrictEqual([
      { id: STEP, missingRuns: 2, runs: 2 },
    ]);
  });

  it('reports a timer missing from more than half the runs', () => {
    const results = [run([STEP]), run([]), run([]), run([])];

    expect(findMissingTimers(results)).toStrictEqual([
      { id: STEP, missingRuns: 3, runs: 4 },
    ]);
  });

  it('tolerates a timer missing from half the runs or fewer', () => {
    const results = [run([STEP]), run([STEP]), run([])];

    expect(findMissingTimers(results)).toStrictEqual([]);
    expect(findMissingTimers([run([STEP]), run([])])).toStrictEqual([]);
  });

  it('counts only successful runs', () => {
    const failed: BenchmarkRunResult = {
      timers: [],
      expectedTimers: [STEP],
      success: false,
    };

    expect(findMissingTimers([failed, failed, run([STEP])])).toStrictEqual([]);
  });

  it('ignores runs that expect nothing', () => {
    const results = [
      { timers: [], success: true },
      { timers: [], expectedTimers: [], success: true },
    ];

    expect(findMissingTimers(results)).toStrictEqual([]);
  });

  it('judges each timer on its own runs', () => {
    const results = [
      run(['a'], ['a', 'b']),
      run(['a'], ['a', 'b']),
      run(['a'], ['a']),
    ];

    expect(findMissingTimers(results)).toStrictEqual([
      { id: 'b', missingRuns: 2, runs: 2 },
    ]);
  });
});

describe('assertNoMissingTimers', () => {
  it('names each missing timer with its counts', () => {
    const results = [run([], ['a', 'b']), run(['b'], ['a', 'b'])];

    expect(() => assertNoMissingTimers(results)).toThrow(
      'Timers missing from more than 50% of runs: a (2 of 2)',
    );
  });

  it('does not throw when every timer is present', () => {
    expect(() => assertNoMissingTimers([run([STEP])])).not.toThrow();
  });
});

describe('runBenchmarkWithIterations', () => {
  it('rejects a flow whose expected timer never appears', async () => {
    await expect(
      runBenchmarkWithIterations(
        'flow',
        async () => run([`${STEP}Legacy`]),
        2,
        0,
        {},
      ),
    ).rejects.toThrow(`${STEP} (2 of 2)`);
  });

  it('summarizes a flow whose expected timer is present', async () => {
    const summary = await runBenchmarkWithIterations(
      'flow',
      async () => run([STEP, `${STEP}Legacy`]),
      2,
      0,
      {},
    );

    expect(summary.timers.map((timer) => timer.id)).toStrictEqual(
      expect.arrayContaining([STEP]),
    );
  });
});
