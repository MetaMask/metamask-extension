(function () {
  window.top.SNOW((w) => {
    console.log('SNOW INTERCEPTED NEW WINDOW CREATION IN METAMASK APP: ', w, w?.frameElement);
  });
} ())
