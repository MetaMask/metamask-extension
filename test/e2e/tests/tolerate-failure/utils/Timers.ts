// Type definitions
export interface Timer {
  start: number | null;
  end: number | null;
  duration: number | null;
}

export interface TimerWithId extends Timer {
  id: string;
}

class Timers {
  private static instance: Timers;
  private timers!: Map<string, Timer>;

  constructor() {
    if (!Timers.instance) {
      this.timers = new Map<string, Timer>(); // Store the timers in a map
      Timers.instance = this;
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
    const timer = this.timers.get(id)!;
    timer.start = Date.now();
  }

  // Stop a timer
  stopTimer(id: string): void {
    if (!this.timers.has(id) || this.timers.get(id)?.start === null) {
      throw new Error(`Timer with id "${id}" does not exist or has not been started.`);
    }
    const timer = this.timers.get(id)!;
    timer.end = Date.now();
    timer.duration = timer.end - timer.start!;
  }

  // Get the value of a timer
  getTimer(id: string): Timer {
    if (!this.timers.has(id)) {
      throw new Error(`Timer with id "${id}" does not exist.`);
    }
    return this.timers.get(id)!;
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

const instance = new Timers();
Object.freeze(instance); // Ensure that the instance cannot be modified
export default instance;
