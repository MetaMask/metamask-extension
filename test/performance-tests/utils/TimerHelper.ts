import Timers from './Timers';

const THRESHOLD_MARGIN = 0.1; // 10% margin

/**
 * TimerHelper - A wrapper around the Timers singleton that provides
 * threshold validation and a convenient measure() method for performance testing.
 */
class TimerHelper {
  private _id: string;

  private _baseThreshold: number | null;

  /**
   * Creates a new timer with optional threshold
   *
   * @param id - Timer description/identifier
   * @param threshold - Threshold in ms (effective threshold = base + 10% margin)
   */
  constructor(id: string, threshold?: number) {
    this._id = id;
    this._baseThreshold = threshold ?? null;
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
      const currentDuration = Date.now() - timer.start;
      return currentDuration;
    }
    // Timer never started
    return null;
  }

  changeName(newName: string): void {
    const oldId = this._id;
    Timers.renameTimer(oldId, newName);
    this._id = newName;
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

  /**
   * Returns the base threshold (without margin)
   */
  get baseThreshold(): number | null {
    return this._baseThreshold;
  }

  /**
   * Returns the effective threshold (base + 10% margin)
   */
  get threshold(): number | null {
    if (this._baseThreshold === null) {
      return null;
    }
    return Math.round(this._baseThreshold * (1 + THRESHOLD_MARGIN));
  }

  /**
   * Returns whether this timer has a threshold defined
   */
  hasThreshold(): boolean {
    return this._baseThreshold !== null;
  }

  get id(): string {
    return this._id;
  }
}

export default TimerHelper;
