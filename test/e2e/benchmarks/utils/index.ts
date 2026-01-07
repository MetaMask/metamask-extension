import Timers from '../../../timers/Timers';
import type { TimerResult } from './types';

export * from './types';
export * from './constants';
export * from './statistics';
export * from './runner';

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
