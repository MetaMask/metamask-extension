/* eslint-disable-next-line */
import { TextEncoder, TextDecoder } from 'util';
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

global.indexedDB = {};

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
process.on('unhandledRejection', (reason, promise) => {
  console.log('Unhandled rejection:', reason);
  unhandledRejections.set(promise, reason);
});
process.on('rejectionHandled', (promise) => {
  console.log(`handled: ${unhandledRejections.get(promise)}`);
  unhandledRejections.delete(promise);
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

log.setDefaultLevel(5);
global.log = log;

//
// polyfills
//

// dom
const jsdom = new JSDOM();
global.window = jsdom.window;

// required by `trezor-connect/node_modules/whatwg-fetch`
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
global.self = window;
// required by `dom-helpers` and various other libraries
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
global.document = window.document;
// required by `react-tippy`
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
global.navigator = window.navigator;
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
global.Element = window.Element;
// required by `react-popper`
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
global.HTMLElement = window.HTMLElement;

// Jest no longer adds the following timers so we use set/clear Timeouts
global.setImmediate =
  global.setImmediate || ((fn, ...args) => global.setTimeout(fn, 0, ...args));
global.clearImmediate =
  global.clearImmediate || ((id) => global.clearTimeout(id));

// required by any components anchored on `popover-content`
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
const popoverContent = window.document.createElement('div');
popoverContent.setAttribute('id', 'popover-content');
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
window.document.body.appendChild(popoverContent);

// Fetch
// fetch is part of node js in future versions, thus triggering no-shadow
// eslint-disable-next-line no-shadow
const { default: fetch, Headers, Request, Response } = require('node-fetch');

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
Object.assign(window, { fetch, Headers, Request, Response });
// some of our libraries currently assume that `fetch` is globally available,
// so we need to assign this for tests to run
global.fetch = fetch;

// localStorage
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
window.localStorage = {
  removeItem: () => null,
};

// used for native dark/light mode detection
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
window.matchMedia = () => true;

// override @metamask/logo
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
window.requestAnimationFrame = () => undefined;

// crypto.getRandomValues
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
if (!window.crypto) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  window.crypto = {};
}
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
if (!window.crypto.getRandomValues) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line node/global-require, no-restricted-globals
  window.crypto.getRandomValues = require('crypto').webcrypto.getRandomValues;
}

// TextEncoder/TextDecoder
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
window.TextEncoder = TextEncoder;
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
window.TextDecoder = TextDecoder;

// Used to test `clearClipboard` function
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
if (!window.navigator.clipboard) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  window.navigator.clipboard = {};
}
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
if (!window.navigator.clipboard.writeText) {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
  // eslint-disable-next-line no-restricted-globals
  window.navigator.clipboard.writeText = () => undefined;
}

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
window.SVGPathElement = window.SVGPathElement || { prototype: {} };

// scrollIntoView is not available in JSDOM
// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31888
// eslint-disable-next-line no-restricted-globals
window.HTMLElement.prototype.scrollIntoView = () => undefined;
