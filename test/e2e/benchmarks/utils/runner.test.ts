import type { Driver } from '../../webdriver/driver';
import {
  collectGarbageBetweenIterations,
  runBenchmarkWithIterations,
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

describe('runBenchmarkWithIterations logging', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation();
    // The failure-path test drives `runWithRetries` into `retry()`, which logs
    // through `console.error`. Silence it so the console baseline stays clean.
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const logsFrom = () => logSpy.mock.calls.flat().join('\n');

  it('announces every iteration before running it', async () => {
    const benchmarkFn = jest
      .fn()
      .mockResolvedValue({ timers: [], success: true });

    await runBenchmarkWithIterations('sendTransactions', benchmarkFn, 3, 0, {});

    const logs = logsFrom();
    expect(logs).toContain('[sendTransactions] iteration 1/3 started');
    expect(logs).toContain('[sendTransactions] iteration 2/3 started');
    expect(logs).toContain('[sendTransactions] iteration 3/3 started');
  });

  // The falsifier. Before this change a failed iteration emitted nothing at all,
  // so a run that stalled and a run that never started were the same in the log.
  it('reports a failed iteration instead of dropping it silently', async () => {
    const benchmarkFn = jest
      .fn()
      .mockResolvedValue({ timers: [], success: false, error: 'boom' });

    const summary = await runBenchmarkWithIterations(
      'sendTransactions',
      benchmarkFn,
      2,
      0,
      {},
    );

    const logs = logsFrom();
    expect(logs).toContain('[sendTransactions] iteration 1/2 failed: boom');
    expect(logs).toContain('[sendTransactions] iteration 2/2 failed: boom');
    expect(summary.failedRuns).toBe(2);
  });

  it('names the iteration that stalled when a later one never completes', async () => {
    // One success then a hang: the log must still show iteration 2 starting, so
    // the stall is attributable to it rather than to unmarked silence.
    const benchmarkFn = jest
      .fn()
      .mockResolvedValueOnce({ timers: [], success: true })
      .mockImplementationOnce(() => new Promise(() => undefined));

    const pending = runBenchmarkWithIterations(
      'sendTransactions',
      benchmarkFn,
      2,
      0,
      {},
    );
    await Promise.race([pending, Promise.resolve()]);
    await new Promise((resolve) => setImmediate(resolve));

    expect(logsFrom()).toContain('[sendTransactions] iteration 2/2 started');
  });
});
