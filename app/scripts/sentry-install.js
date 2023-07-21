import setupSentry from './lib/setupSentry';

// The root compartment will populate this with hooks
global.stateHooks = {};

// setup sentry error reporting
global.sentry = setupSentry({
  release: process.env.METAMASK_VERSION,
  getState: () => global.stateHooks?.getSentryState?.() || {},
});

/**
 * As soon as state is available via getSentryState we can call the
 * toggleSession method added to sentry in setupSentry to start automatic
 * session tracking.
 */
function waitForStateHooks() {
  if (global.stateHooks.getSentryState) {
    global.sentry.toggleSession();
  } else {
    setTimeout(waitForStateHooks, 100);
  }
}

waitForStateHooks();
