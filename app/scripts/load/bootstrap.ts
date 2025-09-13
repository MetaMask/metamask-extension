/* eslint-disable @typescript-eslint/no-require-imports */
// WARNING: This code runs outside of LavaMoat

// The root compartment will populate this with hooks
global.stateHooks = {} as typeof stateHooks;

// @ts-expect-error - injected by Webpack DefinePlugin
global.bundler = __BUNDLER__;

if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

require('../init-globals');

export {};
