// eslint-disable-next-line import/unambiguous
(function () {
  // Snow does not support Firefox yet
  if (window.navigator.userAgent.includes('Firefox')) {
    return;
  }
  const log = console.log.bind(console);
  window.top.SNOW((w) => {
    const msg = 'SNOW INTERCEPTED NEW WINDOW CREATION IN METAMASK APP: ';
    log(msg, w, w?.frameElement);
  });
})();
