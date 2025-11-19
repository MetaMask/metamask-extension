/**
 * Timer class representing an individual timer with start/stop functionality
 */
export class Timer {
  private _id: string;

  private _start: number | null = null;

  private _end: number | null = null;

  private _duration: number | null = null;

  constructor(id: string) {
    this._id = id;
  }

  get id(): string {
    return this._id;
  }

  get start(): number | null {
    return this._start;
  }

  get end(): number | null {
    return this._end;
  }

  get duration(): number | null {
    return this._duration;
  }

  startTimer(): void {
    this._start = Date.now();
  }

  stopTimer(): void {
    if (this._start === null) {
      throw new Error(`Timer "${this._id}" has not been started.`);
    }
    this._end = Date.now();
    this._duration = this._end - this._start;
  }

  getDuration(): number | null {
    // If timer has been stopped, return the recorded duration
    if (this._duration !== null) {
      return this._duration;
    }
    // If timer is running but not stopped, calculate current elapsed time
    if (this._start !== null) {
      const currentDuration = Date.now() - this._start;
      console.log(
        `⏱️ Timer "${this._id}" is still running, current elapsed: ${currentDuration}ms`,
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
    return this._start !== null && this._duration === null;
  }

  isCompleted(): boolean {
    return this._duration !== null;
  }
}
