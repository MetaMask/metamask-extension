import { type DebounceSettings, type DebouncedFunc, debounce } from 'lodash';
import log from 'loglevel';

export type { DebounceSettings } from 'lodash';

/**
 * A type representing a generic operation that can be executed.
 */
export type Op = (...params: any[]) => unknown | Promise<unknown>;

/**
 * Options for the lock used in the OperationSafener.
 */
type Config<O extends Op> = {
  /**
   * The operation to be debounced and executed safely.
   */
  op: O;
  /**
   * The wait time in milliseconds for the debounce function. Defaults to 0ms.
   */
  wait?: number;
  /**
   * Additional options for the debounce function. See
   * [lodash's debounce documentation](https://lodash.com/docs/4.17.15#debounce)
   * for more details.
   */
  options?: DebounceSettings;
};

export class OperationSafener<O extends Op = Op> {
  /**
   * A debounced function that wraps the operation to be executed.
   * It ensures that the operation is not called too frequently. And that no
   * two operations are ever executed at the same time.
   */
  #bouncer: DebouncedFunc<(...params: Parameters<O>) => Promise<ReturnType<O>>>;

  #evacuating: Promise<void> | null = null;

  /**
   * Creates an instance of OperationSafener.
   *
   * This class is designed to safely execute operations that may be
   * invoked frequently or in quick succession. It debounces the execution of
   * the operation, ensuring that it is only executed once within a specified
   * wait time.
   *
   * Additionally, it ensures that no two operations are executed
   * at the same time, if any operation might take longer than the `wait` time
   * to complete.
   *
   * Finally, it provides a method to evacuate the current operation queue,
   * executing the latest pending operation and preventing any future
   * operations from being queued.
   *
   * @param config - Configuration object for the OperationSafener.
   * @example
   * ```ts
   * const operationSafener = new OperationSafener({
   *   op: async (data) => {
   *     // Perform some operation with data
   *     console.log('Operation executed with:', data);
   *   },
   *   wait: 1000, // Wait for 1 second before executing the operation
   * });
   * // queued
   * operationSafener.execute('example data 1');
   * // queued, previous call is removed
   * operationSafener.execute('example data 2');
   * // _immediately_ logs `example data 2` _only_
   * await operationSafener.evacuate();
   * // never logs, call to `evacuate` prevents any future operations.
   * operationSafener.execute('example data 3');
   * ```
   */
  constructor({ op, wait, options }: Config<O>) {
    const opts: LockOptions = { mode: 'exclusive' };
    const func = (...params: Parameters<O>) =>
      navigator.locks.request('lock', opts, () => op(...params));
    this.#bouncer = debounce(func, wait, options);
  }

  /**
   * Evacuates the current operation queue, executing the latest pending
   * operation and preventing any future operations from being queued.
   *
   * @returns A Promise that resolves when the evacuation is complete.
   */
  evacuate = () => {
    if (this.#evacuating) {
      log.warn('already evacuating');
      return this.#evacuating;
    }

    this.#evacuating = new Promise(async (resolve) => {
      try {
        // flush will invoke the latest pending op, then return a Promise that
        // resolves to the result of running that `op`.
        await this.#bouncer.flush();
      } finally {
        resolve();
      }
    });
    return this.#evacuating;
  };

  /**
   * Executes the operation with the provided parameters, debouncing it if
   * necessary.
   *
   * If the OperationSafener is currently evacuating or has been evacuated,
   * this method will return false and not queue the operation.
   *
   * @param params - Parameters to pass to the operation.
   * @returns A boolean indicating whether the operation was queued for
   * execution.
   */
  execute = (...params: Parameters<O>) => {
    if (this.#evacuating) {
      log.warn('evacuating, ignoring call to `execute`');
      return false;
    }

    // fire and forget, return values for debounced functions are complicated
    // and not useful for our use case
    this.#bouncer(...params);
    return true;
  };
}
