/**
 * Re-runs the given function until it returns a resolved promise or the number
 * of retries is exceeded, whichever comes first (with an optional delay in
 * between retries).
 *
 * @param {object} args - A set of arguments and options.
 * @param {number} args.retries - The maximum number of times to re-run the
 * function on failure.
 * @param {number} [args.delay] - The amount of time (in milliseconds) to wait in
 * between retries. (Default: 0)
 * @param {string} [args.rejectionMessage] - The message for the rejected promise
 * this function will return in the event of failure. (Default: "Retry limit
 * reached")
 * @param {boolean} [args.retryUntilFailure] - Retries until the function fails.
 * @param {Function} functionToRetry - The function that is run and tested for
 * failure.
 * @returns {Promise<* | null | Error>} a promise that either resolves with one of the following:
 * - If successful, resolves with the return value of functionToRetry.
 * - If functionToRetry fails while retryUntilFailure is true, resolves with null.
 * - Otherwise it is rejected with rejectionMessage.
 */
async function retry(
  {
    retries,
    delay = 0,
    rejectionMessage = 'Retry limit reached',
    retryUntilFailure = false,
  },
  functionToRetry,
) {
  let attempts = 0;
  while (attempts <= retries) {
    if (attempts > 0 && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const result = await functionToRetry();
      if (!retryUntilFailure) {
        return result;
      }
    } catch (error) {
      if (error.message === "Exited with code '1'") {
        console.log("retry() received: Exited with code '1'");
      } else {
        console.error('error caught in retry():', error);
      }

      if (attempts < retries) {
        console.log('Ready to retry() again');
      }

      if (retryUntilFailure) {
        return null;
      }
    } finally {
      attempts += 1;
    }
  }

  throw new Error(rejectionMessage);
}

module.exports = { retry };
