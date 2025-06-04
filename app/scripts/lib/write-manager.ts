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
      return await navigator.locks.request(LOCK_NAME, opts, () => {
        return write(...params);
      });
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
   * An AbortController used to cancel a pending safe reload operation.
   */
  reloadAbortController: AbortController | null = null;

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
    this.reloadAbortController = new AbortController();
    this.abortingPromise = navigator.locks.request(
      LOCK_NAME,
      { mode: 'exclusive', signal: this.reloadAbortController.signal },
      () => browser.runtime.reload(),
    );
    return await this.abortingPromise;
  }

  /**
   * Stops the current reload operation if one is in progress.
   * This will cancel the ongoing reload and restart the WriteManager to
   * accept new writes again.
   * @returns
   */
  async cancelReload() {
    if (!this.reloadAbortController) {
      log.debug('No reload in progress, nothing to cancel');
      return;
    }
    log.debug('Cancelling reload in progress');
    this.reloadAbortController.abort('Reload cancelled');
    this.reloadAbortController = null;
    this.abortingPromise = null;
    await this.restart(); // restart the WriteManager to accept new writes
  }

  stop() {
    if (this.isStopped()) {
      log.debug('WriteManager is already stopped, no need to stop again');
      return;
    }
    this._write.cancel();
    // stop accepting new writes
    this.abortController.abort('reloading');
  }

  /**
   * Restarts the WriteManager, allowing it to accept new writes again.
   * If there is a pending write, it will be added to the debounce queue.
   * @returns
   */
  async restart() {
    if (!this.isStopped()) {
      log.debug('WriteManager is already running, no need to start again');
      return;
    }
    // if we are in the middle of a reload, we need to abort it
    this.reloadAbortController?.abort('WriteManager restarted');
    this.reloadAbortController = null;
    this.abortingPromise = null;

    this.abortController = new AbortController();
    // we need a new debounced function since the old one has a used up
    // abort controller
    this._write = this.getDebouncer();

    // if there are pending writes, we need to put them in the debounce queue.
    if (this.pendingWrite) {
      log.debug('Executing pending write operation');
      const pendingWrite = this.pendingWrite;
      this.pendingWrite = null;
      await this._write(...pendingWrite);
    }
  }

  private pendingWrite: unknown[] | null = null;

  /**
   * Writes data to the underlying storage. The data might not be written if
   * another write operation happens after this call but before the
   * debounced function executes.
   *
   * If the WriteManager is stopped, the data will be stored in a pending
   * write queue and executed when the WriteManager is started again, unless
   * another write operation happens in the meantime.
   *
   * Note: this is a fire and forget operation, meaning it doesn't return
   * anything. You will never know when your write operation has been executed.
   *
   * @param params The data to write.
   */
  write(...params: unknown[]) {
    if (this.isStopped()) {
      this.pendingWrite = params;
      return;
    }
    // ignore the return value of the debounced function, as it just returns
    // the return value of the _previous_ _write operation, which is not
    // useful to us.
    this._write(...params);
  }
}
