// Type definitions
export type Timer = {
  start: number | null;
  end: number | null;
  duration: number | null;
};

export type TimerWithId = {
  id: string;
} & Timer;

class Timers {
  private static instance: Timers;

  private timers: Map<string, Timer>;

  private constructor() {
    this.timers = new Map<string, Timer>(); // Store the timers in a map
  }

  public static getInstance(): Timers {
    if (!Timers.instance) {
      Timers.instance = new Timers();
    }
    return Timers.instance;
  }

  // Create a new timer
  createTimer(id: string): Timer | undefined {
    if (this.timers.has(id)) {
      /* eslint-disable no-console */
      console.log(`Timer with id "${id}" already exists.`);
      return this.timers.get(id);
    }
    const timer: Timer = { start: null, end: null, duration: null };
    this.timers.set(id, timer);
    return timer;
  }

  // Start a timer
  startTimer(id: string): void {
    if (!this.timers.has(id)) {
      throw new Error(`Timer with id "${id}" does not exist.`);
    }
    const timer = this.timers.get(id);
    if (timer) {
      timer.start = Date.now();
    }
  }

  // Stop a timer
  stopTimer(id: string): void {
    if (!this.timers.has(id) || this.timers.get(id)?.start === null) {
      throw new Error(
        `Timer with id "${id}" does not exist or has not been started.`,
      );
    }
    const timer = this.timers.get(id);
    if (timer && timer.start !== null) {
      timer.end = Date.now();
      timer.duration = timer.end - timer.start;
    }
  }

  // Get the value of a timer
  getTimer(id: string): Timer {
    if (!this.timers.has(id)) {
      throw new Error(`Timer with id "${id}" does not exist.`);
    }
    const timer = this.timers.get(id);
    if (!timer) {
      throw new Error(`Timer with id "${id}" does not exist.`);
    }
    return timer;
  }

  // Get all timers
  getAllTimers(): TimerWithId[] {
    return Array.from(this.timers.entries()).map(([id, timer]) => ({
      id,
      ...timer,
    }));
  }

  // Clear all timers
  resetTimers(): void {
    this.timers.clear();
  }
}

const instance = Timers.getInstance();
Object.freeze(instance); // Ensure that the instance cannot be modified
export default instance;
