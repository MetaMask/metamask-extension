/**
 * Small statistics helpers for the main-commit performance detector.
 */

// One-sided 95% Student t critical values for 1 to 30 degrees of freedom.
const T95 = [
  6.314, 2.92, 2.353, 2.132, 2.015, 1.943, 1.895, 1.86, 1.833, 1.812, 1.796,
  1.782, 1.771, 1.761, 1.753, 1.746, 1.74, 1.734, 1.729, 1.725, 1.721, 1.717,
  1.714, 1.711, 1.708, 1.706, 1.703, 1.701, 1.699, 1.697,
];

// Beyond 30 degrees of freedom the normal critical value is close enough.
export function tCritical95(degreesOfFreedom: number): number {
  if (degreesOfFreedom < 1) {
    throw new Error('Need at least one degree of freedom');
  }
  return T95[degreesOfFreedom - 1] ?? 1.645;
}

export function mean(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardDeviation(values: number[]): number {
  const center = mean(values);
  const squares = values.reduce((sum, value) => sum + (value - center) ** 2, 0);
  return Math.sqrt(squares / (values.length - 1));
}

export type ShiftSummary = {
  jobs: number;
  // Percent change of head over base, from the mean log ratio of the jobs.
  shiftPct: number;
  // One-sided 95% bounds on the shift, in percent.
  lowerPct: number;
  upperPct: number;
  // Spread of the per-job shifts, in percent.
  sdPct: number;
};

export const toPercent = (logRatio: number) => 100 * (Math.exp(logRatio) - 1);

/**
 * @param logRatios - One natural-log ratio of head to base per job.
 * @returns The mean shift with one-sided 95% bounds, or undefined with fewer than two jobs.
 */
export function summarizeShifts(logRatios: number[]): ShiftSummary | undefined {
  if (logRatios.length < 2) {
    return undefined;
  }
  const center = mean(logRatios);
  const sd = standardDeviation(logRatios);
  const margin =
    (tCritical95(logRatios.length - 1) * sd) / Math.sqrt(logRatios.length);
  return {
    jobs: logRatios.length,
    shiftPct: toPercent(center),
    lowerPct: toPercent(center - margin),
    upperPct: toPercent(center + margin),
    sdPct: 100 * sd,
  };
}
