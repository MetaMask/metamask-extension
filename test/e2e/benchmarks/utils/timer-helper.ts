import Timers from './timers';
import type { TimerResult } from './types';

/**
 * TimerHelper - A wrapper around the Timers singleton that provides
 * a convenient measure() method for performance testing.
 */
class TimerHelper {
  private _id: string;

  /**
   * Creates a new timer
   *
   * @param id - Timer description/identifier
   */
  constructor(id: string) {
    this._id = id;
    Timers.createTimer(this.id);
  }

  start(): void {
    Timers.startTimer(this.id);
  }

  stop(): void {
    Timers.stopTimer(this.id);
  }

  getDuration(): number | null {
    const timer = Timers.getTimer(this.id);
    // If timer has been stopped, return the recorded duration
    if (timer.duration !== null) {
      return timer.duration;
    }
    // If timer is running but not stopped, calculate current elapsed time
    if (timer.start !== null) {
      const currentDuration = performance.now() - timer.start;
      return currentDuration;
    }
    // Timer never started
    return null;
  }

  getDurationInSeconds(): number {
    const duration = this.getDuration();
    return duration ? duration / 1000 : 0;
  }

  /**
   * Measures the execution time of an async action
   *
   * @param action - Async function to measure
   * @returns Returns this for chaining
   */
  async measure(action: () => Promise<void>): Promise<TimerHelper> {
    this.start();
    try {
      await action();
    } finally {
      this.stop();
    }
    return this;
  }

  get id(): string {
    return this._id;
  }
}

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

export default TimerHelper;
