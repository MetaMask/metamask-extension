import type { TimerStatistics } from '../../../../shared/constants/benchmarks';
import type { Driver } from '../../webdriver/driver';
import {
  collectGarbageBetweenIterations,
  convertTimerStatisticsToBenchmarkResults,
} from './runner';

function createTimerStats(
  id: string,
  overrides: Partial<TimerStatistics> = {},
): TimerStatistics {
  return {
    id,
    mean: 100,
    min: 90,
    max: 110,
    stdDev: 5,
    cv: 5,
    p50: 100,
    p75: 105,
    p95: 109,
    p99: 110,
    samples: 3,
    outliers: 0,
    dataQuality: 'good',
    ...overrides,
  };
}

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

describe('convertTimerStatisticsToBenchmarkResults', () => {
  it("carries each timer's retained values into the artifact", () => {
    const results = convertTimerStatisticsToBenchmarkResults(
      [
        createTimerStats('uiStartup', {
          values: [
            { iteration: 0, value: 90 },
            { iteration: 2, value: 110 },
          ],
        }),
      ],
      'measurePageStandard',
    );

    expect(results.values).toStrictEqual({
      uiStartup: [
        { iteration: 0, value: 90 },
        { iteration: 2, value: 110 },
      ],
    });
  });

  it('omits values entirely when no timer retained any', () => {
    const results = convertTimerStatisticsToBenchmarkResults(
      [createTimerStats('uiStartup')],
      'measurePageStandard',
    );

    expect(results).not.toHaveProperty('values');
    expect(results.mean.uiStartup).toBe(100);
  });

  it('keeps the metrics that did retain values when another did not', () => {
    const results = convertTimerStatisticsToBenchmarkResults(
      [
        createTimerStats('uiStartup', {
          values: [{ iteration: 0, value: 90 }],
        }),
        createTimerStats('load'),
      ],
      'measurePageStandard',
    );

    expect(Object.keys(results.values ?? {})).toStrictEqual(['uiStartup']);
  });
});
