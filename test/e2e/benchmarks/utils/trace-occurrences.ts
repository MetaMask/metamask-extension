import type { TraceName, TraceOccurrence } from '../../../../shared/lib/trace';
import type { Driver } from '../../webdriver/driver';
import type { TimerResult } from './types';

/**
 * Read every completed trace occurrence from the page the driver is on.
 *
 * The durations are measured by the app's own `trace()` / `endTrace()` calls,
 * on the browser's clock, so they carry no WebDriver round trip or poll
 * interval, which the test-process step timers do.
 *
 * @param driver - The WebDriver instance, on an extension page.
 * @returns The occurrences in completion order.
 */
export async function readTraceOccurrences(
  driver: Driver,
): Promise<TraceOccurrence[]> {
  const occurrences = await driver.executeScript(
    () => window.stateHooks?.getCustomTraceOccurrences?.() ?? null,
  );
  if (!Array.isArray(occurrences)) {
    throw new Error(
      'Trace occurrences are unavailable: this build does not expose stateHooks.getCustomTraceOccurrences',
    );
  }
  return occurrences as TraceOccurrence[];
}

/**
 * Turn the last completed occurrence of a trace into a benchmark timer.
 *
 * An absent or failed measurement throws, so the iteration fails with the
 * trace named instead of the value dropping out of the sample.
 *
 * @param occurrences - Occurrences read by {@link readTraceOccurrences}.
 * @param name - The trace to read.
 * @param id - The benchmark metric id to report it under.
 * @returns The timer result for the last occurrence.
 */
export function traceTimerResult(
  occurrences: TraceOccurrence[],
  name: TraceName,
  id: string,
): TimerResult {
  const matching = occurrences.filter((occurrence) => occurrence.name === name);
  const last = matching[matching.length - 1];

  if (!last) {
    throw new Error(
      `Trace "${name}" did not complete, so "${id}" has no value`,
    );
  }
  if (!last.success) {
    throw new Error(
      `Trace "${name}" last completed unsuccessfully, so "${id}" is not a timing`,
    );
  }

  // Tagged with a unit so the runner leaves it out of the per-run `total`,
  // which sums only untagged timers: the spans overlap the step timers, and
  // adding both would count the same time twice.
  return { id, value: last.duration, unit: 'ms' };
}

/**
 * Report how many times a trace completed. A trace restarted by user input
 * completes more than once, and a change in that count changes what the last
 * duration covers.
 *
 * @param occurrences - Occurrences read by {@link readTraceOccurrences}.
 * @param name - The trace to count.
 * @param id - The benchmark metric id to report it under.
 * @returns The count as a timer result.
 */
export function traceCountResult(
  occurrences: TraceOccurrence[],
  name: TraceName,
  id: string,
): TimerResult {
  return {
    id,
    value: occurrences.filter((occurrence) => occurrence.name === name).length,
    unit: 'count',
  };
}
