const { setTimeout } = require('timers/promises');

/**
 * Run the given function, retrying it upon failure until reaching the
 * specified number of retries.
 *
 * @param {number} retries - The number of retries upon failure to attempt.
 * @param {function} functionToRetry - The function that will be retried upon failure.
 */
async function retry(...args) {
  let retries, options, functionToRetry;
  const defaultOptions = { delay: 0, rejectionMessage: 'Retry limit reached' };

  if (args.length === 3) {
    retries = args[0];
    options = { ...defaultOptions, ...args[1] };
    functionToRetry = args[2];
  } else {
    retries = args[0];
    options = defaultOptions;
    functionToRetry = args[1];
  }

  let attempts = 0;
  while (attempts <= retries) {
    try {
      await functionToRetry();
      return;
    } catch (error) {
      console.error(error);
    } finally {
      attempts += 1;
      if (options.delay > 0) {
        await setTimeout(options.delay);
      }
    }
  }
  throw new Error(options.rejectionMessage);
}

module.exports = { retry };
