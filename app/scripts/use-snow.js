/*
NOTICE:
This Snow + LavaMoat scuttling integration is currently being used
with an experimental API (https://github.com/LavaMoat/LavaMoat/pull/462).
Changing this code must be done cautiously to avoid breaking the app!
*/

// eslint-disable-next-line import/unambiguous
(function () {
  const log = console.log.bind(console);
  const warn = console.warn.bind(console);
  // eslint-disable-next-line no-undef
  const isWorker = !self.document;
  const msg =
    'Snow detected a new realm creation attempt in MetaMask. Performing scuttling on new realm.';

  /**
   * Safely executes the scuttle function with error handling to prevent
   * memory exhaustion errors (e.g., NS_ERROR_UNEXPECTED in Firefox) from
   * crashing the application.
   *
   * @param {object} target - The realm or window to scuttle
   * @param {Function} scuttle - The scuttle function to execute
   */
  function safeScuttle(target, scuttle) {
    try {
      scuttle(target);
    } catch (error) {
      // Handle Firefox NS_ERROR_UNEXPECTED and other memory-related errors
      // that can occur during Snow's object enumeration in complex Snap environments
      const errorName = error?.name || '';
      const errorMessage = error?.message || String(error);

      if (
        errorName === 'NS_ERROR_UNEXPECTED' ||
        errorMessage.includes('out of memory') ||
        errorMessage.includes('NS_ERROR_UNEXPECTED')
      ) {
        warn(
          'Snow scuttling encountered a memory error and was skipped for this realm. ' +
            'This may occur with complex Snap execution environments. ' +
            'Security policies are still enforced by LavaMoat.',
          error,
        );
      } else {
        // Re-throw unexpected errors that aren't memory-related
        warn('Snow scuttling encountered an error:', error);
        throw error;
      }
    }
  }

  // eslint-disable-next-line no-undef
  Object.defineProperty(self, 'SCUTTLER', {
    value: (realm, scuttle) => {
      if (isWorker) {
        safeScuttle(realm, scuttle);
      } else {
        // eslint-disable-next-line no-undef
        self.SNOW((win) => {
          log(msg, win);
          safeScuttle(win, scuttle);
        }, realm);
      }
    },
  });
})();
