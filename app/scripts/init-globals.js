/**
 * This script add properties in globalThis and initialises them with undefined.
 * This is workaround needed to avoid error in runtime-cjs.js which is thrown when loading
 * scripts that include accessing variables not available to service worker in MV3.
 */

// eslint-disable-next-line import/unambiguous
const keys = ['XMLHttpRequest'];

keys.forEach((key) => {
  if (!Reflect.has(globalThis, key)) {
    globalThis[key] = undefined;
  }
});

if (!Reflect.has(globalThis, 'window')) {
  globalThis.window = globalThis;
}
