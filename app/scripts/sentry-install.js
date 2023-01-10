import setupSentry from './lib/setupSentry';

// The root compartment will populate this with hooks
global.stateHooks = {};

// setup sentry error reporting
global.sentry = setupSentry({
  release: process.env.METAMASK_VERSION,
  getState: () => global.stateHooks?.getSentryState?.() || {},
});
