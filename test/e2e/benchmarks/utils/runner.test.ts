import type { Driver } from '../../webdriver/driver';
import {
  collectGarbageBetweenIterations,
  computeStepSpanMetrics,
  withStepSpanTimers,
} from './runner';

function createMockDriver(
  overrides: {
    executeScript?: jest.Mock;
    innerSendDevToolsCommand?: jest.Mock | null;
  } = {},
): Driver {
  const innerDriver: Record<string, unknown> = {};

  if (overrides.innerSendDevToolsCommand !== null) {
    innerDriver.sendDevToolsCommand =
      overrides.innerSendDevToolsCommand ??
      jest.fn().mockResolvedValue(undefined);
  }

  return {
    executeScript: overrides.executeScript ?? jest.fn().mockResolvedValue(true),
    driver:
      overrides.innerSendDevToolsCommand === null ? undefined : innerDriver,
  } as unknown as Driver;
}

describe('collectGarbageBetweenIterations', () => {
  it('uses window.gc when exposed on the page', async () => {
    const executeScript = jest.fn().mockResolvedValue(true);
    const sendDevToolsCommand = jest.fn().mockResolvedValue(undefined);
    const driver = createMockDriver({
      executeScript,
      innerSendDevToolsCommand: sendDevToolsCommand,
    });

    await collectGarbageBetweenIterations(driver);

    expect(executeScript).toHaveBeenCalledTimes(1);
    expect(sendDevToolsCommand).not.toHaveBeenCalled();
  });

  it('falls back to HeapProfiler.collectGarbage when window.gc is unavailable', async () => {
    const executeScript = jest.fn().mockResolvedValue(false);
    const sendDevToolsCommand = jest.fn().mockResolvedValue(undefined);
    const driver = createMockDriver({
      executeScript,
      innerSendDevToolsCommand: sendDevToolsCommand,
    });

    await collectGarbageBetweenIterations(driver);

    expect(sendDevToolsCommand).toHaveBeenCalledTimes(1);
    expect(sendDevToolsCommand).toHaveBeenCalledWith(
      'HeapProfiler.collectGarbage',
    );
  });

  it('falls back to CDP when window.gc execution throws', async () => {
    const executeScript = jest
      .fn()
      .mockRejectedValue(new Error('script failed'));
    const sendDevToolsCommand = jest.fn().mockResolvedValue(undefined);
    const driver = createMockDriver({
      executeScript,
      innerSendDevToolsCommand: sendDevToolsCommand,
    });

    await collectGarbageBetweenIterations(driver);

    expect(sendDevToolsCommand).toHaveBeenCalledWith(
      'HeapProfiler.collectGarbage',
    );
  });

  it('does nothing when neither window.gc nor CDP are available', async () => {
    const executeScript = jest.fn().mockResolvedValue(false);
    const driver = createMockDriver({
      executeScript,
      innerSendDevToolsCommand: null,
    });

    await expect(
      collectGarbageBetweenIterations(driver),
    ).resolves.toBeUndefined();
  });
});

describe('computeStepSpanMetrics', () => {
  const timer = (id: string, start: number, end: number) => ({
    id,
    start,
    end,
    duration: end - start,
  });

  it('reports the gap left between two steps', () => {
    // 0-100 and 300-400 measured; 100-300 belongs to no step.
    expect(
      computeStepSpanMetrics([timer('a', 0, 100), timer('b', 300, 400)]),
    ).toStrictEqual({ gap: 200, overlap: 0 });
  });

  it('reports overlap when steps double-count an interval', () => {
    // 0-200 and 100-300: span 300, measured 400, so 100ms is counted twice.
    expect(
      computeStepSpanMetrics([timer('a', 0, 200), timer('b', 100, 300)]),
    ).toStrictEqual({ gap: 0, overlap: 100 });
  });

  it('reports both as zero when the steps exactly partition the span', () => {
    expect(
      computeStepSpanMetrics([timer('a', 0, 100), timer('b', 100, 250)]),
    ).toStrictEqual({ gap: 0, overlap: 0 });
  });

  it('never returns a negative, so no sample is dropped by validateMetricValue', () => {
    const overlapping = computeStepSpanMetrics([
      timer('a', 0, 500),
      timer('b', 10, 20),
    ]);
    expect(overlapping?.gap).toBeGreaterThanOrEqual(0);
    expect(overlapping?.overlap).toBeGreaterThanOrEqual(0);
  });

  it('returns null below two completed steps — no inter-step region exists', () => {
    expect(computeStepSpanMetrics([])).toBeNull();
    expect(computeStepSpanMetrics([timer('a', 0, 100)])).toBeNull();
  });

  it('ignores timers that never stopped', () => {
    const unfinished = { id: 'c', start: 500, end: null, duration: null };
    expect(
      computeStepSpanMetrics([
        timer('a', 0, 100),
        timer('b', 300, 400),
        unfinished,
      ]),
    ).toStrictEqual({ gap: 200, overlap: 0 });
  });

  it('excludes fixture setup, because it measures the steps not the run', () => {
    // Steps run 1000-1400 inside a much longer benchmarkFn. A wall-clock
    // bracket would fold withFixtures into the gap; spanning the steps cannot.
    expect(
      computeStepSpanMetrics([timer('a', 1000, 1100), timer('b', 1300, 1400)]),
    ).toStrictEqual({ gap: 200, overlap: 0 });
  });
});

describe('withStepSpanTimers', () => {
  const run = (
    timers: { id: string; value: number; unit?: 'ms' | 'count' }[],
  ) => ({
    timers,
    success: true as const,
  });

  it('appends both diagnostics without disturbing the steps', () => {
    const result = withStepSpanTimers(run([{ id: 'stepA', value: 100 }]), {
      gap: 200,
      overlap: 0,
    });

    expect(result.timers.map((t) => t.id)).toStrictEqual([
      'stepA',
      'unattributedGap',
      'stepOverlap',
    ]);
  });

  it('leaves the per-run total as the sum of the steps', () => {
    const result = withStepSpanTimers(
      run([
        { id: 'stepA', value: 100 },
        { id: 'stepB', value: 200 },
      ]),
      { gap: 900, overlap: 0 },
    );

    // Mirrors the runTotal reduce in runBenchmarkWithIterations.
    const runTotal = result.timers
      .filter((t) => !t.unit)
      .reduce((acc, t) => acc + t.value, 0);

    expect(runTotal).toBe(300);
  });

  it('returns the run untouched when there is nothing to report', () => {
    const original = run([{ id: 'stepA', value: 100 }]);
    expect(withStepSpanTimers(original, null)).toBe(original);
  });
});
