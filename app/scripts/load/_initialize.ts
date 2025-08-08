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
if (process.env.ENABLE_LAVAMOAT === 'true') {
  // `lockdown-more` requires `lockdown`'s `harden`, which is only applied when lavamoat is also applied
  // the original author of `lockdown-more` believed this should be run immediately after `lockdown`, but that
  // is no longer possible to guarantee, because lockdown is abstracted away into the lavamoat webpack plugin
  // and the lavamoat team doesn't want to include lockdown-more in the plugin itself as `lockdown` strictly
  // adheres to the ECMAScript spec.
  require('../lockdown-more');
}

require('../init-globals');

export {};
