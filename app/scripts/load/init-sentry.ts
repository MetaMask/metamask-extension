// WARNING: This code runs outside of LavaMoat.

if (process.env.ENABLE_SENTRY === 'true') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../sentry-install');
}

export {};
