// Polyfill setImmediate which jsdom removes but tsx/cjs needs
globalThis.setImmediate =
  globalThis.setImmediate || ((fn, ...args) => setTimeout(fn, 0, ...args));
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

require('@babel/register');
require('tsx/cjs');

require('./helpers/setup-helper');

global.platform = {
  // Required for: coin overviews components
  openTab: () => undefined,
  // Required for: settings info tab
  getVersion: () => '<version>',
};

global.browser = {
  permissions: {
    request: jest.fn().mockResolvedValue(true),
  },
};
