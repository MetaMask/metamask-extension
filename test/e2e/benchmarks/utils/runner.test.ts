import type { Driver } from '../../webdriver/driver';
import {
  collectGarbageBetweenIterations,
  withUnattributedTimer,
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

describe('withUnattributedTimer', () => {
  const run = (
    timers: { id: string; value: number; unit?: 'ms' | 'count' }[],
  ) => ({
    timers,
    success: true as const,
  });

  const unattributed = (result: { timers: { id: string; value: number }[] }) =>
    result.timers.find((t) => t.id === 'unattributed')?.value;

  it('reports the gap between elapsed and the sum of the steps', () => {
    // Steps sum to 300ms of a 500ms run: 200ms is in no step at all.
    const result = withUnattributedTimer(
      run([
        { id: 'stepA', value: 100 },
        { id: 'stepB', value: 200 },
      ]),
      500,
    );

    expect(unattributed(result)).toBe(200);
  });

  it('reports a negative value when the steps overlap, rather than clamping', () => {
    // Steps sum to 400ms of a 300ms run, so 100ms is counted twice. Clamping
    // to zero would make overlap indistinguishable from a clean partition.
    const result = withUnattributedTimer(
      run([
        { id: 'stepA', value: 200 },
        { id: 'stepB', value: 200 },
      ]),
      300,
    );

    expect(unattributed(result)).toBe(-100);
  });

  it('is excluded from the per-run total, which stays the sum of the steps', () => {
    const result = withUnattributedTimer(
      run([
        { id: 'stepA', value: 100 },
        { id: 'stepB', value: 200 },
      ]),
      500,
    );

    // Mirrors the runTotal reduce in runBenchmarkWithIterations.
    const runTotal = result.timers
      .filter((t) => !t.unit)
      .reduce((acc, t) => acc + t.value, 0);

    expect(runTotal).toBe(300);
  });

  it('ignores existing diagnostic timers when summing the steps', () => {
    // Long task metrics already carry a unit and are blocking time inside the
    // steps; counting them would double-book and understate the gap.
    const result = withUnattributedTimer(
      run([
        { id: 'stepA', value: 100 },
        { id: 'longTaskMaxDuration', value: 90, unit: 'ms' },
        { id: 'longTaskCount', value: 3, unit: 'count' },
      ]),
      400,
    );

    expect(unattributed(result)).toBe(300);
  });

  it('preserves the original timers and the run outcome', () => {
    const result = withUnattributedTimer(
      run([{ id: 'stepA', value: 100 }]),
      150,
    );

    expect(result.success).toBe(true);
    expect(result.timers.map((t) => t.id)).toStrictEqual([
      'stepA',
      'unattributed',
    ]);
  });
});
