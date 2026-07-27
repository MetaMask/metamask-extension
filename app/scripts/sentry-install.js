import setupSentry from './lib/setupSentry';

// setup sentry error reporting
global.sentry = setupSentry();
