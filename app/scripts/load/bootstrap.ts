/* eslint-disable @typescript-eslint/no-require-imports */

// HTML surfaces preserve the object created by init-state-hooks. MV3 service
// workers, which have no HTML prelude, create it here.
globalThis.stateHooks ??= {} as typeof stateHooks;

if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

require('../init-globals');

export {};
