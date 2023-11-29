/**
 * Exit the process with an error message.
 *
 * Note that this should be called before the process ends, but it will not
 * itself end the process. This is because the Node.js documentation strongly
 * advises against calling `process.exit` directly.
 *
 * @param {string} errorMessage - The error message that is causing the non-
 *   zero exit code.
 */
function exitWithError(errorMessage) {
  console.error(errorMessage);
  process.exitCode = 1;
  if (process.env.CI) {
    // For some reason, the CI environment does not exit when process.exitCode
    // is set, or at least doesn't terminate immediately. Something may be
    // keeping the event loop from ending. The result is that sometimes jobs
    // fail because of timeout even though none of the individual tests fail.
    // This is a workaround.
    process.exit();
  }
}

module.exports = { exitWithError };
