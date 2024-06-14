export class Poller {
  #interval: number;

  #callback: () => void;

  #handle: NodeJS.Timeout | undefined = undefined;

  constructor(callback: () => void, interval: number) {
    this.#interval = interval;
    this.#callback = callback;
  }

  start() {
    this.stop();
    this.#handle = setInterval(this.#callback, this.#interval);
  }

  stop() {
    if (this.#handle) {
      clearInterval(this.#handle);
      this.#handle = undefined;
    }
  }
}
