import { TraceName } from '../../../../shared/lib/trace';
import type { TraceOccurrence } from '../../../../shared/lib/trace';
import { traceCountResult, traceTimerResult } from './trace-occurrences';

function occurrence(
  name: TraceName,
  duration: number,
  success = true,
): TraceOccurrence {
  return {
    name,
    id: 'default',
    startTime: 0,
    endTime: duration,
    duration,
    success,
  };
}

describe('traceTimerResult', () => {
  it('reports the last completion of the named trace', () => {
    const occurrences = [
      occurrence(TraceName.SwapQuoteFetch, 400),
      occurrence(TraceName.SwapViewLoaded, 900),
      occurrence(TraceName.SwapQuoteFetch, 2100),
    ];

    expect(
      traceTimerResult(occurrences, TraceName.SwapQuoteFetch, 'swapQuoteFetch'),
    ).toStrictEqual({ id: 'swapQuoteFetch', value: 2100, unit: 'ms' });
  });

  it('tags the result with a unit so the per-run total leaves it out', () => {
    const result = traceTimerResult(
      [occurrence(TraceName.SwapViewLoaded, 900)],
      TraceName.SwapViewLoaded,
      'swapViewLoaded',
    );

    expect(result.unit).toBe('ms');
  });

  it('throws when the trace never completed', () => {
    expect(() =>
      traceTimerResult(
        [occurrence(TraceName.SwapViewLoaded, 900)],
        TraceName.SwapQuoteFetch,
        'swapQuoteFetch',
      ),
    ).toThrow('did not complete');
  });

  it('throws when the last completion failed, even after an earlier success', () => {
    expect(() =>
      traceTimerResult(
        [
          occurrence(TraceName.SwapQuoteFetch, 2100),
          occurrence(TraceName.SwapQuoteFetch, 300, false),
        ],
        TraceName.SwapQuoteFetch,
        'swapQuoteFetch',
      ),
    ).toThrow('last completed unsuccessfully');
  });
});

describe('traceCountResult', () => {
  it('counts every completion of the named trace, failed ones included', () => {
    const occurrences = [
      occurrence(TraceName.SwapQuoteFetch, 400),
      occurrence(TraceName.SwapViewLoaded, 900),
      occurrence(TraceName.SwapQuoteFetch, 300, false),
      occurrence(TraceName.SwapQuoteFetch, 2100),
    ];

    expect(
      traceCountResult(
        occurrences,
        TraceName.SwapQuoteFetch,
        'swapQuoteFetchCount',
      ),
    ).toStrictEqual({ id: 'swapQuoteFetchCount', value: 3, unit: 'count' });
  });
});
