// The root compartment will populate this with hooks
global.stateHooks = {} as typeof stateHooks;

if (process.env.ENABLE_SNOW === 'true') {
  require('@lavamoat/snow/snow.prod');
  require('../use-snow');
}
if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

require('../init-globals');
