// when scuttling is set to accept a SCUTTLER and we want to avoid using snow in one of the runtimes, we need the basic scuttler still.
// eslint-disable-next-line import/unambiguous
(function () {
  // eslint-disable-next-line no-undef
  Object.defineProperty(self, 'SCUTTLER', {
    value: (realm, scuttle) => {
      scuttle(realm);
    },
  });
})();
