/* eslint-disable @typescript-eslint/no-require-imports */
// currently only used in webpack build.

if (process.env.ENABLE_LAVAMOAT === 'true') {
  // `lockdown-more` requires `lockdown`'s `harden`, which is only applied when lavamoat is also applied
  // the original author of `lockdown-more` believed this should be run immediately after `lockdown`, but that
  // is no longer possible to guarantee, because lockdown is abstracted away into the lavamoat webpack plugin
  // and the lavamoat team doesn't want to include lockdown-more in the plugin itself as `lockdown` strictly
  // adheres to the ECMAScript spec.
  require('../lockdown-more');
}

export {};
