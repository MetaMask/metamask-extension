/**
 * Run the given function, retrying it upon failure until reaching the
 * specified number of retries.
 *
 * @param {number} retries - The number of retries upon failure to attempt.
 * @param {function} functionToRetry - The function that will be retried upon failure.
 */
async function retry(retries, functionToRetry) {
  let attempts = 0;
  while (attempts <= retries) {
    try {
      await functionToRetry();
      return;
    } catch (error) {
      console.error(error);
    } finally {
      attempts += 1;
    }
  }
  throw new Error('Retry limit reached');
}

module.exports = { retry };
