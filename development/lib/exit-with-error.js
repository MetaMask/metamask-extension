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
}

module.exports = { exitWithError };
