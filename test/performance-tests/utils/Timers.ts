export type TimerData = {
  start: number | null;
  end: number | null;
  duration: number | null;
};

export type TimerWithId = TimerData & {
  id: string;
};

class Timers {
  private static instance: Timers;

  private timers: Map<string, TimerData>;

  private constructor() {
    this.timers = new Map();
  }

  static getInstance(): Timers {
    if (!Timers.instance) {
      Timers.instance = new Timers();
    }
    return Timers.instance;
  }

  createTimer(id: string): TimerData {
    if (this.timers.has(id)) {
      console.log(`Timer with id "${id}" already exists.`);
      return this.timers.get(id) as TimerData;
    }
    const timer: TimerData = { start: null, end: null, duration: null };
    this.timers.set(id, timer);
    return timer;
  }

  startTimer(id: string): void {
    if (!this.timers.has(id)) {
      throw new Error(`Timer with id "${id}" does not exist.`);
    }
    const timer = this.timers.get(id) as TimerData;
    timer.start = performance.now();
  }

  stopTimer(id: string): void {
    if (!this.timers.has(id)) {
      throw new Error(`Timer with id "${id}" does not exist.`);
    }
    const timer = this.timers.get(id) as TimerData;
    timer.end = performance.now();
    timer.duration = timer.end - (timer.start as number);
  }

  getTimer(id: string): TimerData {
    if (!this.timers.has(id)) {
      throw new Error(`Timer with id "${id}" does not exist.`);
    }
    return this.timers.get(id) as TimerData;
  }

  renameTimer(oldId: string, newId: string): void {
    if (!this.timers.has(oldId)) {
      throw new Error(`Timer with id "${oldId}" does not exist.`);
    }
    if (this.timers.has(newId)) {
      throw new Error(`Timer with id "${newId}" already exists.`);
    }
    const timerData = this.timers.get(oldId) as TimerData;
    this.timers.delete(oldId);
    this.timers.set(newId, timerData);
  }

  getAllTimers(): TimerWithId[] {
    return Array.from(this.timers.entries()).map(([id, timer]) => ({
      id,
      ...timer,
    }));
  }

  resetTimers(): void {
    this.timers.clear();
  }
}

const instance = Timers.getInstance();
export default instance;
