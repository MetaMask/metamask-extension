/**
 * This script add properties in globalThis and initialises them with undefined.
 * This is workaround needed to avoid error in dependencies expecting to be run in a browser
 * these dependencies are not available to service worker in MV3.
 */

/* eslint-disable import-x/unambiguous -- script loaded via importScripts, not a module */
/**
 * Log thrown values with fields DevTools often omits, then rethrow for importScripts.
 *
 * @param {string} section - Which step failed (e.g. XHR placeholder vs window alias).
 * @param {unknown} error - Thrown value.
 * @param {string} [key] - Optional global name when the failure is per-key.
 */
function logInitGlobalsFailure(section, error, key) {
  const label =
    key === undefined ? section : `${section} (globalThis['${key}'])`;
  /** @type {Record<string, unknown>} */
  const details = { string: String(error) };
  if (error !== null && typeof error === 'object') {
    if ('message' in error) {
      details.message = error.message;
    }
    if ('name' in error) {
      details.name = error.name;
    }
    if ('code' in error) {
      details.code = error.code;
    }
  }
  console.error(`MetaMask init-globals: ${label}`, details);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  throw error;
}

const keys = ['XMLHttpRequest'];

for (const key of keys) {
  try {
    if (!Reflect.has(globalThis, key)) {
      globalThis[key] = undefined;
    }
  } catch (error) {
    logInitGlobalsFailure(
      'Failed while setting a global placeholder for a browser-only API',
      error,
      key,
    );
  }
}

try {
  if (!Reflect.has(globalThis, 'window')) {
    globalThis.window = globalThis;
  }
} catch (error) {
  logInitGlobalsFailure(
    'Failed while assigning globalThis.window = globalThis',
    error,
  );
}
