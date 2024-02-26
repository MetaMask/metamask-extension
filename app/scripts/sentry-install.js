import setupSentry from './lib/setupSentry';

// The root compartment will populate this with hooks
global.stateHooks = global.stateHooks || {};

// setup sentry error reporting
global.sentry = setupSentry({
  release: process.env.METAMASK_VERSION,
  getState: () => global.stateHooks?.getSentryState?.() || {},
});

/**
 * As soon as state is available via getSentryState we can start automatic
 * session tracking.
 */
async function waitForStateHooks() {
  if (global.stateHooks.getSentryState) {
    // sentry is not defined in dev mode, so if sentry doesn't exist at this
    // point it means that we are in dev mode and do not need to toggle the
    // session. Using optional chaining is sufficient to prevent the error in
    // development.
    await global.sentry?.startSession();
  } else {
    setTimeout(waitForStateHooks, 100);
  }
}

waitForStateHooks();
