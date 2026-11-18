import type { TimerStatistics } from '../../../../shared/constants/benchmarks';
import { convertTimerStatisticsToBenchmarkResults } from './runner';

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
