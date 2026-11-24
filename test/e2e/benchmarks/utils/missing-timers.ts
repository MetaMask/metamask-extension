import { checkExclusionRate, MAX_EXCLUSION_RATE } from './statistics';
import type { BenchmarkRunResult } from './types';

export type MissingTimer = {
  id: string;
  /** Successful runs that listed the timer in `expectedTimers` and lack it. */
  missingRuns: number;
  /** Successful runs that listed the timer in `expectedTimers`. */
  runs: number;
};

/**
 * Timers that more than `maxRate` (0 to 1) of the successful runs expected and
 * did not report. A probe that never fires leaves a step with no series, and
 * nothing fails without this count.
 */
export function findMissingTimers(
  results: BenchmarkRunResult[],
  maxRate: number = MAX_EXCLUSION_RATE,
): MissingTimer[] {
  const counts = new Map<string, MissingTimer>();

  for (const result of results) {
    if (!result.success) {
      continue;
    }
    for (const id of result.expectedTimers ?? []) {
      const entry = counts.get(id) ?? { id, missingRuns: 0, runs: 0 };
      entry.runs += 1;
      if (!result.timers.some((timer) => timer.id === id)) {
        entry.missingRuns += 1;
      }
      counts.set(id, entry);
    }
  }

  return [...counts.values()].filter(
    ({ runs, missingRuns }) =>
      !checkExclusionRate(runs, missingRuns, maxRate).passed,
  );
}

/**
 * Throw when {@link findMissingTimers} finds any, naming each with its count.
 *
 * @param results - One result per iteration.
 */
export function assertNoMissingTimers(results: BenchmarkRunResult[]): void {
  const missing = findMissingTimers(results);
  if (missing.length === 0) {
    return;
  }
  const list = missing
    .map(({ id, missingRuns, runs }) => `${id} (${missingRuns} of ${runs})`)
    .join(', ');
  throw new Error(
    `Timers missing from more than ${MAX_EXCLUSION_RATE * 100}% of runs: ${list}`,
  );
}
