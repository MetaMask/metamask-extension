/**
 * This script add properties in globalThis and initialises them with undefined.
 * This is workaround needed to avoid error in dependencies expecting to be run in a browser
 * these dependencies are not available to service worker in MV3.
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
