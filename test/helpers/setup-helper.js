/* eslint-disable-next-line */
import { TextEncoder, TextDecoder } from 'node:util';
import 'fake-indexeddb/auto';
import nock from 'nock';
import log from 'loglevel';
import { JSDOM } from 'jsdom';

process.env.IN_TEST = true;
process.env.METAMASK_BUILD_TYPE = 'main';

global.chrome = {
  runtime: {
    id: 'testid',
    getManifest: () => ({ manifest_version: 2 }),
    sendMessage: () => {
      // no-op
    },
    onMessage: {
      addListener: () => {
        // no-op
      },
    },
  },
};

// Stub for Sentry global
global.sentry = {
  captureException: () => {
    // no-op
  },
  captureFeedback: () => {
    // no-op
  },
  captureMessage: () => {
    // no-op
  },
  lastEventId: () => {
    // no-op
  },
};

nock.disableNetConnect();
nock.enableNetConnect('localhost');
if (typeof beforeEach === 'function') {
  /* eslint-disable-next-line jest/require-top-level-describe */
  beforeEach(() => {
    nock.cleanAll();
  });
}

// catch rejections that are still unhandled when tests exit
const unhandledRejections = new Map();
let ignoreUnhandled = false;
process.on('unhandledRejection', (reason, promise) => {
  if (!ignoreUnhandled) {
    console.log(
      `Unhandled rejection: ..${process.env.IGNORE_UNHANDLED}`,
      reason,
    );
    unhandledRejections.set(promise, reason);
  }
});
process.on('rejectionHandled', (promise) => {
  if (!ignoreUnhandled) {
    console.log(`handled: ${unhandledRejections.get(promise)}`);
    unhandledRejections.delete(promise);
  }
});

process.on('exit', () => {
  if (unhandledRejections.size > 0) {
    console.error(`Found ${unhandledRejections.size} unhandled rejections:`);
    for (const reason of unhandledRejections.values()) {
      console.error('Unhandled rejection: ', reason);
    }
    process.exit(1);
  }
});
// #region Helpers that allow tests to ignore unhandled rejections that might be intentional.
process.resetIgnoreUnhandled = () => {
  // default is false
  ignoreUnhandled = false;
};
process.setIgnoreUnhandled = (ignore) => {
  ignoreUnhandled = ignore;
};
// #endregion

log.setDefaultLevel(5);
global.log = log;

//
// polyfills
//

// dom
const jsdom = new JSDOM();
global.window = jsdom.window;

// required by `trezor-connect/node_modules/whatwg-fetch`
global.self = window;
// required by `dom-helpers` and various other libraries
global.document = window.document;
// required by `react-tippy`
global.navigator = window.navigator;
global.Element = window.Element;
// required by `react-popper`
global.HTMLElement = window.HTMLElement;

// Jest no longer adds the following timers so we use set/clear Timeouts
global.setImmediate =
  global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate =
  global.clearImmediate || ((id) => global.clearTimeout(id));

// required by any components anchored on `popover-content`
const popoverContent = window.document.createElement('div');
popoverContent.setAttribute('id', 'popover-content');
window.document.body.appendChild(popoverContent);

// Fetch
// fetch is part of node js in future versions, thus triggering no-shadow
// eslint-disable-next-line no-shadow
const { default: fetch, Headers, Request, Response } = require('node-fetch');

Object.assign(window, { fetch, Headers, Request, Response });
// some of our libraries currently assume that `fetch` is globally available,
// so we need to assign this for tests to run
global.fetch = fetch;

// localStorage
window.localStorage = {
  removeItem: () => null,
};

// used for native dark/light mode detection
window.matchMedia = (query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {
    // deprecated - no-op
  },
  removeListener: () => {
    // deprecated - no-op
  },
  addEventListener: () => {
    // no-op for tests
  },
  removeEventListener: () => {
    // no-op for tests
  },
  dispatchEvent: () => true,
});

// override @metamask/logo
window.requestAnimationFrame = () => undefined;

// crypto.getRandomValues
if (!window.crypto) {
  window.crypto = {};
}
if (!window.crypto.getRandomValues) {
  // eslint-disable-next-line node/global-require
  window.crypto.getRandomValues = require('crypto').webcrypto.getRandomValues;
}

// TextEncoder/TextDecoder
window.TextEncoder = TextEncoder;
window.TextDecoder = TextDecoder;

// Used to test `clearClipboard` function
if (!window.navigator.clipboard) {
  window.navigator.clipboard = {};
}
if (!window.navigator.clipboard.writeText) {
  window.navigator.clipboard.writeText = () => undefined;
}

window.SVGPathElement = window.SVGPathElement || { prototype: {} };

// scrollIntoView is not available in JSDOM
window.HTMLElement.prototype.scrollIntoView = () => undefined;
