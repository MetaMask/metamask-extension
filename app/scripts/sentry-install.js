import setupSentry from './lib/setupSentry';

// setup sentry error reporting
global.sentry = setupSentry({
  release: process.env.METAMASK_VERSION,
  getState: () => global.getSentryState?.() || {},
});
