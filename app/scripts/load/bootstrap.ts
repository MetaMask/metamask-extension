/* eslint-disable @typescript-eslint/no-require-imports */
// This code runs before LavaMoat

// The root compartment will populate this with hooks
global.stateHooks = {} as typeof stateHooks;

if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

require('../init-globals');

export {};
