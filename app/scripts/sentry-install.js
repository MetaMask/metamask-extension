import setupSentry from './lib/setupSentry';

setInterval(() => {
  console.log(window.localStorage);
}, 2000);

// setup sentry error reporting
global.sentry = setupSentry({
  release: process.env.METAMASK_VERSION,
  getState: () => global.getSentryState?.() || {},
});
