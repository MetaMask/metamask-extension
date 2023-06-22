/*
NOTICE:
This Snow + LavaMoat scuttling integration is currently being used
with an experimental API (https://github.com/LavaMoat/LavaMoat/pull/462).
Changing this code must be done cautiously to avoid breaking the app!
*/

// eslint-disable-next-line import/unambiguous
(function () {
  const log = console.log.bind(console);
  const msg =
    'Snow detected a new realm creation attempt in MetaMask. Performing scuttling on new realm.';
  Object.defineProperty(window.top, 'SCUTTLER', {
    value: (realm, scuttle) => {
      window.top.SNOW((win) => {
        log(msg, win);
        scuttle(win);
      }, realm);
    },
  });
})();
