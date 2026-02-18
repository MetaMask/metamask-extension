// This file is used only for manifest version 3

import './scripts/load/bootstrap';
import { APP_INIT_LIVENESS_METHOD } from '../shared/constants/ui-initialization';
import { ExtensionLazyListener } from './scripts/lib/extension-lazy-listener/extension-lazy-listener';

const { chrome } = globalThis;

// this needs to be run early so we can begin listening to these browser events
// as soon as possible
const lazyListener = new ExtensionLazyListener(chrome, {
  runtime: ['onInstalled', 'onConnect'],
});

// Set the lazy listener on globalThis.stateHooks so that other bundles can
// access it.
globalThis.stateHooks.lazyListener = lazyListener;

let runImportScriptsInitiated = false;

async function runImportScripts() {
  // Bail if we've already run importScripts
  if (runImportScriptsInitiated) {
    return;
  }
  runImportScriptsInitiated = true;

  const startImportScriptsTime = performance.now();

  // eslint-disable-next-line import/extensions
  await import('./scripts/background.js');

  const endImportScriptsTime = performance.now();

  // for performance metrics/reference
  console.log(
    `importScripts completed in ${
      (endImportScriptsTime - startImportScriptsTime) / 1000
    } seconds`,
  );
}

// Ref: https://stackoverflow.com/questions/66406672/chrome-extension-mv3-modularize-service-worker-js-file
// eslint-disable-next-line no-undef
self.addEventListener('install', runImportScripts);

// listen for connection events from other contexts, and respond to liveness
// checks, and ping them to let them know we're listening.
chrome.runtime.onConnect.addListener((port) => {
  console.log(
    'MetaMask service worker: Received connection from port',
    port.name,
  );
  try {
    // `handleOnConnect` can be called asynchronously, well after the `onConnect`
    // event was emitted, due to the lazy listener setup in `service-worker.ts`, so we
    // might not be able to send this message if the window has already closed.
    port.postMessage({
      data: {
        method: APP_INIT_LIVENESS_METHOD,
      },
      name: 'app-init-liveness',
    });
  } catch (e) {
    console.error(
      'MetaMask - app-init-liveness check: Failed to message to port',
      e,
    );
  }
});

/*
 * If the service worker is stopped and restarted, then the 'install' event will not occur
 * and the chrome.runtime.onMessage will only occur if it was a message that restarted the
 * the service worker. To ensure that runImportScripts is called, we need to call it in module
 * scope as below. To avoid having `runImportScripts()` called before installation, we only
 * call it if the serviceWorker state is 'activated'. More on service worker states here:
 * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/state. Testing also shows
 * that whenever the already installed service worker is stopped and then restarted, the state
 * is 'activated'.
 */
// @ts-expect-error - typescript doesn't know about this
// eslint-disable-next-line no-undef
if (self.serviceWorker.state === 'activated') {
  runImportScripts();
}
