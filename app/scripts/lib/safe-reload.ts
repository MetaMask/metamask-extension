import { DebouncedFunc, debounce } from 'lodash';
import browser from 'webextension-polyfill';

type Options = {
  write: (...params: unknown[]) => Promise<unknown>;
  frequency: number;
};

const LOCK_NAME = 'write-manager-lock';

export class WriteManager {
  private abortController = new AbortController();

  private _write: DebouncedFunc<Options['write']>;

  constructor({ write, frequency }: Options) {
    const { signal } = this.abortController;
    const opts: LockOptions = { mode: 'exclusive', signal };
    this._write = debounce(async (...params) => {
      if (this.abortController.signal.aborted) {
        return Promise.reject(new Error('WriteManager has been stopped'));
      }
      return await navigator.locks.request(LOCK_NAME, opts, () => {
        return write(...params);
      });
    }, frequency);
  }

  isStopped() {
    return this.abortController.signal.aborted;
  }

  abortingPromise: Promise<void> | null = null;

  async safeReload() {
    if (this.abortingPromise) {
      // already stopped, no need to reload
      return this.abortingPromise;
    }

    // stop accepting new writes
    this.abortController.abort('reloading');

    // wait for current operations to finish
    this.abortingPromise = navigator.locks.request(
      LOCK_NAME,
      { mode: 'exclusive' },
      () => browser.runtime.reload(),
    );
    return await this.abortingPromise;
  }

  async write(...params: unknown[]) {
    return this._write(...params);
  }
}
