/* eslint-disable @typescript-eslint/no-require-imports */

// Preserve the object created by the pre-LavaMoat init-state-hooks prelude.
// The fallback keeps bootstrap usable in isolated tests.
globalThis.stateHooks ??= {} as typeof stateHooks;

if (process.env.ENABLE_SENTRY === 'true') {
  // Three globals are involved:
  // - the browser global: the real Window or WorkerGlobalScope;
  // - LavaMoat's protected root global: where MetaMask application code runs;
  // - Sentry's restricted package global.
  //
  // Sentry's writable policy bridges its package global to the root global so
  // it can replace these APIs, but the bridge does not adjust a function's
  // `this` value. When Sentry's wrapper calls the original from its package
  // global, LavaMoat cannot translate that receiver to the browser global and
  // native APIs such as fetch throw "Illegal invocation". Binding the originals
  // to the root global here lets LavaMoat translate the receiver correctly.
  // Binding changes function identity and native-function detection. That is
  // acceptable for the configured Sentry integrations: request tracing wraps
  // fetch without a native-function check, and MetaMask supplies the transport.
  // SES also freezes Function.prototype.toString, so Sentry's FunctionToString
  // integration cannot disguise its wrappers as the original functions. It
  // disables itself safely; the only known difference is what wrapped functions
  // return when application code explicitly calls `.toString()` on them.
  // commented out to test LM fix
  // for (const globalName of [
  //   'fetch',
  //   'requestAnimationFrame',
  //   'setInterval',
  //   'setTimeout',
  // ] as const) {
  //   const original = globalThis[globalName];
  //   if (typeof original === 'function') {
  //     Reflect.set(globalThis, globalName, original.bind(globalThis));
  //   }
  // }

  require('../sentry-install');
}

require('../init-globals');

export {};
