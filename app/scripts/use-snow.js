// eslint-disable-next-line import/unambiguous
(function () {
  const log = console.log.bind(console);
  Object.defineProperty(window.top, 'SCUTTLER', {
    value: (realm, scuttle) => {
      window.top.SNOW((win) => {
        log('Snow detected a new realm creation attempt in MetaMask. Performing scuttling on new realm.', win);
        scuttle(win);
      }, realm);
    },
  });
})();
