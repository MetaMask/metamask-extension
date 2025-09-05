/* eslint-disable @typescript-eslint/no-require-imports, node/global-require */
// WARNING: This code runs outside of LavaMoat

// The root compartment will populate this with hooks
global.stateHooks = {};

if (process.env.ENABLE_SENTRY === 'true') {
  require('./sentry-install');
}

require('./init-globals');

export {};
