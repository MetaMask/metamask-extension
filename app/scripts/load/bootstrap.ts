/* eslint-disable @typescript-eslint/no-require-imports */
// This code runs before of LavaMoat

if (process.env.ENABLE_SNOW === 'true') {
  require('@lavamoat/snow/snow.prod');
  require('../use-snow');
}
if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

require('../init-globals');

export {};
