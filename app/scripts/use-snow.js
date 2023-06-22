// eslint-disable-next-line import/unambiguous
(function () {
  const log = console.log.bind(console);
  const msg = 'SNOW INTERCEPTED NEW WINDOW CREATION IN METAMASK APP: ';
  Object.defineProperty(top, 'SCUTTLER', {
    value: (realm, scuttle) => {
      top.SNOW((win) => {
        log(msg, win, win?.frameElement);
        scuttle(win);
      }, realm);
    }
  });
})();
