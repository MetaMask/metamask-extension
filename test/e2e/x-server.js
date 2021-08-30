const { runCommand } = require('../../development/lib/run-command');
const { retry } = require('../../development/lib/retry');

function ensureXServerIsRunning() {
  return retry(
    {
      retries: 3,
      delay: 2000,
      rejectionMessage: 'X server does not seem to be running?!',
    },
    () => {
      return runCommand('xset', ['q']);
    },
  );
}

module.exports = { ensureXServerIsRunning };
