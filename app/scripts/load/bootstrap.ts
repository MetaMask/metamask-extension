/* eslint-disable @typescript-eslint/no-require-imports */

// Preserve the object created by the pre-LavaMoat init-state-hooks prelude.
// The fallback keeps bootstrap usable in isolated tests.
globalThis.stateHooks ??= {} as typeof stateHooks;

if (process.env.ENABLE_SENTRY === 'true') {
  // LavaMoat writable endowments expose the original function without
  // receiver unwrapping. Bind receiver-sensitive globals in the protected root
  // before Sentry replaces them so its wrappers can safely call the originals.
  for (const globalName of [
    'fetch',
    'requestAnimationFrame',
    'setInterval',
    'setTimeout',
  ] as const) {
    const original = globalThis[globalName];
    if (typeof original === 'function') {
      Reflect.set(globalThis, globalName, original.bind(globalThis));
    }
  }

  require('../sentry-install');
}

require('../init-globals');

export {};
