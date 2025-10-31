import Timers, { Timer } from './Timers';

interface PerformanceTracker {
  addTimer(timer: TimerHelper): void;
}

class TimerHelper {
  private _id: string;

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
    const timer: Timer = Timers.getTimer(this.id);
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

  getDurationInSeconds(): number {
    const duration = this.getDuration();
    return duration ? duration / 1000 : 0;
  }

  isRunning(): boolean {
    const timer: Timer = Timers.getTimer(this.id);
    return timer.start !== null && timer.duration === null;
  }

  isCompleted(): boolean {
    const timer: Timer = Timers.getTimer(this.id);
    return timer.duration !== null;
  }

  get id(): string {
    return this._id;
  }

  // Runs the provided async function while timing it, and automatically
  // registers the timer with the given performanceTracker.
  // Usage:
  // await TimerHelper.withTimer(performanceTracker, 'Step name', async () => { /* ... */ });
  static async withTimer<T>(
    performanceTracker: PerformanceTracker,
    id: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const timer = new TimerHelper(id);
    timer.start();
    try {
      const result = await fn();
      return result;
    } finally {
      timer.stop();
      performanceTracker.addTimer(timer);
    }
  }
}

export default TimerHelper;
