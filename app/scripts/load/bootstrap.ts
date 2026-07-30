/* eslint-disable @typescript-eslint/no-require-imports */

// Preserve the object created by the pre-LavaMoat init-state-hooks prelude.
// The fallback keeps bootstrap usable in isolated tests.
globalThis.stateHooks ??= {} as typeof stateHooks;

if (process.env.ENABLE_SENTRY === 'true') {
  require('../sentry-install');
}

require('../init-globals');

export {};
