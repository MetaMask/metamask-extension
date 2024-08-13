export class Poller {
  #interval: number;

  #callback: () => void;

  #handle: NodeJS.Timeout | undefined = undefined;

  constructor(callback: () => void, interval: number) {
    this.#interval = interval;
    this.#callback = callback;
  }

  start() {
    if (this.#handle) {
      return;
    }

    this.#handle = setInterval(this.#callback, this.#interval);
  }

  stop() {
    if (!this.#handle) {
      return;
    }
    clearInterval(this.#handle);
    this.#handle = undefined;
  }
}
