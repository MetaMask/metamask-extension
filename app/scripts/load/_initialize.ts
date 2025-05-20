/* eslint-disable @typescript-eslint/no-require-imports */
// currently only used in webpack build.

// The root compartment will populate this with hooks
global.stateHooks = {} as typeof stateHooks;

if (process.env.ENABLE_SENTRY === 'true') {
  // LM: This is already running under lavamoat if bundled. can be marked as excluded in webpack config but scuttling will run before the bundle anyway. To run sentry outside lavamoat we'll probably need to leave it outside the bundle
  require('../sentry-install');
}
if (process.env.ENABLE_SNOW === 'true') {
  // LM: this may be too late for snow to run, we'll figure it out soon
  require('@lavamoat/snow/snow.prod');
  require('../use-snow');
}
// LM: we should be running lockdown-more always - to avoid introducing changes that will break under that anyway.
// if (process.env.ENABLE_LOCKDOWN === 'true') {
// LM: not calling lockdown here because lavamoat webpack plugin's runtime already did before invoking the entry to the bundle.
// LM: This is the perfect place to run lockdown-more as the first thing in the bundle.
require('../lockdown-more');
// }

require('../init-globals');

export {};
