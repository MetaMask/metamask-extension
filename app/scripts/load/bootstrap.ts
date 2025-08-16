/* eslint-disable @typescript-eslint/no-require-imports */
// currently only used in webpack build.

if (process.env.ENABLE_SNOW === 'true') {
  require('@lavamoat/snow/snow.prod');
  require('../use-snow');
}
if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

require('../init-globals');

export {};
