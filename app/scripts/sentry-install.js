import { initializeSentry } from '../../shared/modules/sentry.utils';

// The root compartment will populate this with hooks
global.stateHooks = {};

// setup sentry error reporting
global.sentry = initializeSentry();
