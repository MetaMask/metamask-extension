/**
 * Timer utilities for converting Timers singleton data to benchmark formats
 */
import Timers from './Timers';
import type { TimerResult } from './types';

/**
 * Convert Timers singleton data to TimerResult array for benchmark runner.
 * Use this at the end of a benchmark to collect all timer results.
 */
export function collectTimerResults(): TimerResult[] {
  return Timers.getAllTimers()
    .filter((t) => t.duration !== null)
    .map((t) => ({
      id: t.id,
      duration: t.duration as number,
    }));
}
