/* eslint-disable @typescript-eslint/no-require-imports */
// WARNING: This code runs outside of LavaMoat.

if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

export {};
