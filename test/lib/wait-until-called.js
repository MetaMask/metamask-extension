const DEFAULT_TIMEOUT = 10000;

/**
 * A function that wraps a sinon stub and returns an asynchronous function
 * that resolves if the stubbed function was called enough times, or throws
 * if the timeout is exceeded.
 *
 * The stub that has been passed in will be setup to call the wrapped function
 * directly.
 *
 * WARNING: Any existing `callsFake` behavior will be overwritten.
 *
 * @param {import('sinon').stub} stub - A sinon stub of a function
 * @param {unknown} [wrappedThis] - The object the stubbed function was called
 *   on, if any (i.e. the `this` value)
 * @param {object} [options] - Optional configuration
 * @param {number} [options.callCount] - The number of calls to wait for.
 * @param {number|null} [options.timeout] - The timeout, in milliseconds. Pass
 *   in `null` to disable the timeout.
 * @returns {Function} An asynchronous function that resolves when the stub is
 *   called enough times, or throws if the timeout is reached.
 */
function waitUntilCalled(
  stub,
  wrappedThis = null,
  { callCount = 1, timeout = DEFAULT_TIMEOUT } = {},
) {
  let numCalls = 0;
  let resolve;
  let timeoutHandle;
  const stubHasBeenCalled = new Promise((_resolve) => {
    resolve = _resolve;
    if (timeout !== null) {
      timeoutHandle = setTimeout(
        () => resolve(new Error('Timeout exceeded')),
        timeout,
      );
    }
  });
  stub.callsFake((...args) => {
    try {
      if (stub.wrappedMethod) {
        stub.wrappedMethod.call(wrappedThis, ...args);
      }
    } finally {
      if (numCalls < callCount) {
        numCalls += 1;
        if (numCalls === callCount) {
          if (timeoutHandle) {
            clearTimeout(timeoutHandle);
          }
          resolve();
        }
      }
    }
  });

  return async () => {
    const error = await stubHasBeenCalled;
    if (error) {
      throw error;
    }
  };
}

module.exports = waitUntilCalled;
