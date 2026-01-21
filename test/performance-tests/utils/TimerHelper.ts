import Timers from './Timers';

const THRESHOLD_MARGIN = 0.1; // 10% margin

export type BrowserThreshold = {
  chrome: number;
  firefox: number;
};

/**
 * TimerHelper - A wrapper around the Timers singleton that provides
 * threshold validation and a convenient measure() method for performance testing.
 */
class TimerHelper {
  private _id: string;

  private _thresholdConfig: BrowserThreshold | null;

  private _baseThreshold: number | null;

  /**
   * Creates a new timer with optional browser-specific thresholds
   * @param id - Timer description/identifier
   * @param threshold - Browser-specific thresholds in ms (effective threshold = base + 10%)
   * @param browser - The browser name to determine threshold ('chrome' or 'firefox')
   */
  constructor(
    id: string,
    threshold?: BrowserThreshold,
    browser?: 'chrome' | 'firefox',
  ) {
    this._id = id;
    this._thresholdConfig = threshold ?? null;
    this._baseThreshold = this._resolveThreshold(threshold, browser);
    Timers.createTimer(this.id);
  }

  /**
   * Resolves the appropriate threshold based on browser
   */
  private _resolveThreshold(
    threshold?: BrowserThreshold,
    browser?: 'chrome' | 'firefox',
  ): number | null {
    if (!threshold) {
      return null;
    }

    if (!browser) {
      console.warn(
        'TimerHelper: browser not provided, cannot determine threshold',
      );
      return null;
    }

    return threshold[browser];
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
      console.log(
        `⏱️ Timer "${this.id}" is still running, current elapsed: ${currentDuration}ms`,
      );
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
