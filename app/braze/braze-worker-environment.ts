import { createBrazeDocument } from './braze-document';

/**
 * Install the Web SDK's compatibility globals before importing it. This must
 * run in a dedicated worker: a facade in a page is not a security boundary.
 *
 * Navigator and location expose only scalar snapshots. Native worker events
 * and XMLHttpRequest can reach the worker itself, but cannot reach any page.
 */
export function installBrazeWorkerEnvironment(): void {
  if (typeof importScripts !== 'function' || typeof document !== 'undefined') {
    throw new Error('Braze SDK must run in a dedicated worker without a DOM');
  }

  const { href } = globalThis.location;
  const navigatorSnapshot = Object.freeze({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    onLine: navigator.onLine,
    cookieEnabled: false,
  });

  const globals = {
    document: createBrazeDocument(href),
    navigator: navigatorSnapshot,
    location: Object.freeze({ href }),
    screen: Object.freeze({ width: 0, height: 0 }),
    // The SDK uses window for timers, XHR, and its initialized event.
    window: globalThis,
    // These APIs have no role in identity synchronization. Deny them even in
    // development builds, where the rest of the extension skips LavaMoat.
    chrome: undefined,
    browser: undefined,
    Worker: undefined,
    SharedWorker: undefined,
    indexedDB: undefined,
    localStorage: undefined,
    Notification: undefined,
    ServiceWorkerRegistration: undefined,
    EventSource: undefined,
    open: undefined,
  };
  for (const [name, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, name, {
      value,
      writable: false,
      configurable: false,
    });
  }
}
