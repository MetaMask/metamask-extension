/*
NOTICE:
This Snow + LavaMoat scuttling integration is currently being used
with an experimental API (https://github.com/LavaMoat/LavaMoat/pull/462).
Changing this code must be done cautiously to avoid breaking the app!
*/

// eslint-disable-next-line import/unambiguous
(function () {
  const log = console.log.bind(console);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-undef, no-restricted-globals
  const isWorker = !self.document;
  const msg =
    'Snow detected a new realm creation attempt in MetaMask. Performing scuttling on new realm.';
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-undef, no-restricted-globals
  Object.defineProperty(self, 'SCUTTLER', {
    value: (realm, scuttle) => {
      if (isWorker) {
        scuttle(realm);
      } else {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
        // eslint-disable-next-line no-undef, no-restricted-globals
        self.SNOW((win) => {
          log(msg, win);
          scuttle(win);
        }, realm);
      }
    },
  });
})();
