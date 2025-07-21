import setupSentry from '../../shared/lib/setupSentry';

// The root compartment will populate this with hooks
global.stateHooks = global.stateHooks || {};

// setup sentry error reporting
global.sentry = setupSentry();
