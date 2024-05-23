/*
NOTICE:
This Snow + LavaMoat scuttling integration is currently being used
with an experimental API (https://github.com/LavaMoat/LavaMoat/pull/462).
Changing this code must be done cautiously to avoid breaking the app!
*/

// eslint-disable-next-line import/unambiguous
const {
  // eslint-disable-next-line camelcase
  fetch: { __sentry_original__ },
} = globalThis;

// eslint-disable-next-line import/unambiguous
(function () {
  const log = console.log.bind(console);
  // eslint-disable-next-line no-undef
  const isWorker = !self.document;
  const msg =
    'Snow detected a new realm creation attempt in MetaMask. Performing scuttling on new realm.';

  const tamedFetch = (path) => {
    const regex = /^chrome-extension:\/\/.+\/.*?\/images\/.*?/u;
    if (regex.test(path)) {
      return __sentry_original__(path);
    }
    throw new Error(
      'Tamed fetch can only be used on images within the extension',
    );
  };
  const scuttleWithRestrictedException = (
    _scuttle,
    _ref,
    restrictedExceptions,
  ) => {
    for (const key in restrictedExceptions) {
      if (Object.hasOwn(restrictedExceptions, key)) {
        Object.defineProperty(_ref, key, {
          configurable: false,
          writable: false,
          value: restrictedExceptions[key],
        });
      }
    }
    return _scuttle(_ref);
  };

  // eslint-disable-next-line no-undef
  const chromeExtensionId = chrome && chrome.runtime && chrome.runtime.id;

  // eslint-disable-next-line no-undef
  Object.defineProperty(self, 'SCUTTLER', {
    value: (realm, scuttle) => {
      if (isWorker) {
        chromeExtensionId
          ? scuttleWithRestrictedException(scuttle, realm, {
              fetch: tamedFetch,
              OffscreenCanvas: globalThis.OffscreenCanvas,
            })
          : scuttle(realm);
      } else {
        // eslint-disable-next-line no-undef
        self.SNOW((win) => {
          log(msg, win);
          chromeExtensionId
            ? scuttleWithRestrictedException(scuttle, win, {
                fetch: tamedFetch,
                OffscreenCanvas: globalThis.OffscreenCanvas,
              })
            : scuttle(win);
        }, realm);
      }
    },
  });
})();
