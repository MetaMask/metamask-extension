import type { TimerStatistics } from '../../../../shared/constants/benchmarks';
import type { Driver } from '../../webdriver/driver';
import {
  collectGarbageBetweenIterations,
  convertTimerStatisticsToBenchmarkResults,
} from './runner';

const timer: TimerStatistics = {
  id: 'uiStartup',
  mean: 100,
  min: 90,
  max: 120,
  stdDev: 5,
  cv: 5,
  p50: 99,
  p75: 105,
  p95: 118,
  p99: 120,
  samples: 3,
  outliers: 0,
  dataQuality: 'good',
};

describe('convertTimerStatisticsToBenchmarkResults', () => {
  it('carries raw samples into the result untouched', () => {
    const samples = { uiStartup: [90, 99, 5000] };
    const result = convertTimerStatisticsToBenchmarkResults(
      [timer],
      'title',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      samples,
    );
    expect(result.samples).toStrictEqual(samples);
  });

  it('omits samples when none are given', () => {
    const result = convertTimerStatisticsToBenchmarkResults([timer], 'title');
    expect(result).not.toHaveProperty('samples');
  });
});

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
