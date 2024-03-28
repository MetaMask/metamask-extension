// currently only used in webpack build.

// The root compartment will populate this with hooks
global.stateHooks = {} as any;

if (process.env.ENABLE_LAVAMOAT) {
  // TODO: lavamoat support
  throw new Error('LAVAMOAT not supported in webpack build yet');
} else {
  if (process.env.ENABLE_SNOW) {
    require('@lavamoat/snow/snow.prod');
    require('./use-snow');
  }
  process.env.ENABLE_SENTRY && (require('./sentry-install'));
  require('./init-globals');
  require('./runtime-cjs');
  require('./background');
}

export {};
