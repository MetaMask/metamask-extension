/* eslint-disable @typescript-eslint/no-require-imports */
// currently only used in webpack build.

// The root compartment will populate this with hooks
global.stateHooks = {} as typeof stateHooks;

if (process.env.ENABLE_LAVAMOAT === 'true') {
  // TODO: lavamoat support
  throw new Error('LAVAMOAT not supported in webpack build yet');
} else {
  if (process.env.ENABLE_SENTRY === 'true') {
    require('../sentry-install');
  }
  if (process.env.ENABLE_SNOW === 'true') {
    require('@lavamoat/snow/snow.prod');
    require('../use-snow');
  }
  if (process.env.ENABLE_LOCKDOWN === 'true') {
    require('../lockdown-install');
    require('../lockdown-run');
    require('../lockdown-more');
  }

  require('../init-globals');
  require('../runtime-cjs');
}

export {};
