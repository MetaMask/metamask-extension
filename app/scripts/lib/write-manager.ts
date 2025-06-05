import { DebouncedFunc, debounce } from 'lodash';
import log from 'loglevel';
import browser from 'webextension-polyfill';

type Options = {
  write: (...params: unknown[]) => Promise<unknown>;
  frequency: number;
};

const LOCK_NAME = 'write-manager-lock';

/**
 * WriteManager is a utility class that manages write operations to our storage.
 * It ensures that writes are debounced and executed in a controlled manner,
 * and providing a mechanism to safely reload the extension while waiting for
 * ongoing writes to complete, and preventing new writes from being accepted
 * during the reload.
 */
export class WriteManager {
  /**
   * The AbortController is used to cancel ongoing write operations and
   * prevent new writes from being accepted while the WriteManager is stopped.
   */
  private abortController = new AbortController();

  /**
   * The debounced write function that will execute write operations.
   */
  private _write: DebouncedFunc<Options['write']>;

  /**
   * The options for the WriteManager
   */
  private options: Options;

  constructor(options: Options) {
    this.options = options;
    this._write = this.getDebouncer();
  }

  /**
   * Creates a debounced function that will execute the write operation
   * at most once every `frequency` milliseconds. The write operation is wrapped
   * in a lock to ensure that only one write operation can be executed at a
   * time, this lock is cancellable which allows the `safeReload` function to
   * wait for the current write operation to finish before reloading the
   * extension.
   *
   * @returns A debounced function that wraps the write operation.
   */
  private getDebouncer() {
    const { write, frequency } = this.options;
    const { signal } = this.abortController;
    const opts: LockOptions = { mode: 'exclusive', signal };

    return debounce(async (...params) => {
      if (this.abortController.signal.aborted) {
        return Promise.reject(new Error('WriteManager has been stopped'));
      }
      return await navigator.locks.request(
        LOCK_NAME,
        opts,
        async () => await write(...params),
      );
    }, frequency);
  }

  /**
   * Checks if the WriteManager is stopped, meaning no new writes are being
   * accepted.
   *
   * @returns true if the WriteManager is stopped, false otherwise.
   */
  isStopped() {
    return this.abortController.signal.aborted;
  }

  /**
   * Keeps track of the current reload operation, as only one reload can be in
   * progress at a time.
   */
  abortingPromise: Promise<void> | null = null;

  /**
   * Safely reloads the extension by stopping the WriteManager, waiting for
   * ongoing write operations to complete, and then reloading the extension.
   * If a reload is already in progress, it will wait for that to complete.
   * If the reload is cancelled, it will automatically restart the WriteManager
   * to begin accepting new writes again.
   *
   * @returns A promise that resolves when the reload is complete, or rejects
   * if the reload is cancelled.
   */
  async safeReload() {
    if (this.abortingPromise) {
      // already stopped, no need to reload
      log.debug('WriteManager is already stopped, no need to reload');
      return this.abortingPromise;
    }

    await this._write.flush();
    this.stop();

    // wait for current operations to finish
    this.abortingPromise = await navigator.locks.request(
      LOCK_NAME,
      { mode: 'exclusive' },
      () => browser.runtime.reload(),
    );
    return await this.abortingPromise;
  }

  /**
   * Stops the WriteManager, meaning it will no longer accept new write
   * operations. It will also cancel any ongoing write operations and
   * prevent any new writes from being accepted.
   */
  stop() {
    if (this.isStopped()) {
      log.debug('WriteManager is already stopped, no need to stop again');
      return;
    }
    // stop accepting new writes
    this.abortController.abort('reloading');
    this._write.cancel();
  }

  /**
   * Writes data to the underlying storage. The data might not be written if
   * another write operation happens after this call but before the
   * debounced function executes.
   *
   *
   * Note: this is a fire and forget operation, meaning it doesn't return
   * anything. You will never know when your write operation has been executed.
   *
   * @param params - The data to write.
   */
  write(...params: unknown[]) {
    if (this.isStopped()) {
      log.warn('WriteManager is stopped, ignoring write operation');
      return;
    }
    // ignore the return value of the debounced function, as it just returns
    // the return value of the _previous_ _write operation, which is not
    // useful to us.
    this._write(...params);
  }
}
