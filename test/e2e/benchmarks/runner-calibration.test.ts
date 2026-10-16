import { summarizeCalibration } from './runner-calibration';

describe('summarizeCalibration', () => {
  it('calculates calibration summaries for each metric', () => {
    const summary = summarizeCalibration([
      {
        navigationLoadMs: 10,
        scriptStartMs: 20,
        cpuWorkMs: 30,
        longTaskTotalDurationMs: 40,
        tbtMs: 50,
      },
      {
        navigationLoadMs: 20,
        scriptStartMs: 30,
        cpuWorkMs: 40,
        longTaskTotalDurationMs: 50,
        tbtMs: 60,
      },
      {
        navigationLoadMs: 30,
        scriptStartMs: 40,
        cpuWorkMs: 50,
        longTaskTotalDurationMs: 60,
        tbtMs: 70,
      },
    ]);

    expect(summary).toStrictEqual({
      sampleCount: 3,
      metrics: {
        navigationLoadMs: { mean: 20, median: 20, p90: 30 },
        scriptStartMs: { mean: 30, median: 30, p90: 40 },
        cpuWorkMs: { mean: 40, median: 40, p90: 50 },
        longTaskTotalDurationMs: { mean: 50, median: 50, p90: 60 },
        tbtMs: { mean: 60, median: 60, p90: 70 },
      },
    });
  });

  it('throws when no samples are provided', () => {
    expect(() => summarizeCalibration([])).toThrow(
      'Runner calibration requires at least one sample',
    );
  });
});
