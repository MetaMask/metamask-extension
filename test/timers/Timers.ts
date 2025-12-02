import { Timer } from './Timer.js';

// Re-export Timer for convenience
export { Timer } from './Timer.ts';

/**
 * Type for timer data with ID (used for serialization)
 */
export type TimerWithId = {
  id: string;
  start: number | null;
  end: number | null;
  duration: number | null;
};

/**
 * Timers singleton class that manages a collection of Timer instances
 */
class Timers {
  private static instance: Timers;

  private timers: Map<string, Timer>;

  private constructor() {
    this.timers = new Map<string, Timer>();
  }

  public static getInstance(): Timers {
    if (!Timers.instance) {
      Timers.instance = new Timers();
    }
    return Timers.instance;
  }

  /**
   * Create a new timer with the given ID
   * Returns existing timer if one with the same ID already exists
   *
   * @param id
   */
  createTimer(id: string): Timer {
    if (this.timers.has(id)) {
      /* eslint-disable no-console */
      console.log(`Timer with id "${id}" already exists.`);
      return this.timers.get(id) as Timer;
    }
    const timer = new Timer(id);
    this.timers.set(id, timer);
    return timer;
  }

  /**
   * Get a timer by ID
   *
   * @param id
   */
  getTimer(id: string): Timer {
    const timer = this.timers.get(id);
    if (!timer) {
      throw new Error(`Timer with id "${id}" does not exist.`);
    }
    return timer;
  }

  /**
   * Get all timers as serializable objects with IDs
   */
  getAllTimers(): TimerWithId[] {
    return Array.from(this.timers.values()).map((timer) => ({
      id: timer.id,
      start: timer.start,
      end: timer.end,
      duration: timer.duration,
    }));
  }

  /**
   * Clear all timers
   */
  resetTimers(): void {
    this.timers.clear();
  }
}

const instance = Timers.getInstance();
Object.freeze(instance); // Ensure that the instance cannot be modified
export default instance;
