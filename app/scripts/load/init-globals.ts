/**
 * WARNING: This code runs outside of LavaMoat.
 * This script adds properties in `globalThis` and initialises them with undefined.
 * This is workaround needed to avoid error in dependencies expecting to be run in a browser
 * where these dependencies are not available to service worker in MV3.
 */

const keys = ['XMLHttpRequest'];

keys.forEach((key) => {
  if (!Reflect.has(globalThis, key)) {
    // @ts-expect-error - dynamic global shim for MV3 service worker
    globalThis[key] = undefined;
  }
});

if (!Reflect.has(globalThis, 'window')) {
  // @ts-expect-error - dynamic global shim for MV3 service worker
  globalThis.window = globalThis;
}

export {};
