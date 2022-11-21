// eslint-disable-next-line import/unambiguous
(function () {
  window.top.SNOW((w) => {
    const msg = 'SNOW INTERCEPTED NEW WINDOW CREATION IN METAMASK APP: ';
    console.log(msg, w, w?.frameElement);
  });
})();
