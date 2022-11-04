/**
 * Re-runs the given function until it returns a resolved promise or the number
 * of retries is exceeded, whichever comes first (with an optional delay in
 * between retries).
 *
 * @param {object} args - A set of arguments and options.
 * @param {number} args.retries - The maximum number of times to re-run the
 * function on failure.
 * @param {number} args.delay - The amount of time (in milliseconds) to wait in
 * between retries. (Default: 0)
 * @param {string} args.rejectionMessage - The message for the rejected promise
 * this function will return in the event of failure. (Default: "Retry limit
 * reached")
 * @param {Function} functionToRetry - The function that is run and tested for
 * failure.
 * @returns {Promise<null | Error>} a promise that either resolves to null if
 * the function is successful or is rejected with rejectionMessage otherwise.
 */
async function retry(
  { retries, delay = 0, rejectionMessage = 'Retry limit reached' },
  functionToRetry,
) {
  let attempts = 0;
  while (attempts <= retries) {
    if (attempts > 0 && delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      await functionToRetry();
      return;
    } catch (error) {
      console.error(error);
    } finally {
      attempts += 1;
    }
  }

  throw new Error(rejectionMessage);
}

module.exports = { retry };
