// This file is used only for manifest version 3

import './scripts/load/bootstrap';
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

/*
 * A keepalive message listener to prevent Service Worker getting shut down due to inactivity.
 * UI sends the message periodically, in a setInterval.
 * Chrome will revive the service worker if it was shut down, whenever a new message is sent, but only if a listener was defined here.
 *
 * chrome below needs to be replaced by cross-browser object,
 * but there is issue in importing webextension-polyfill into service worker.
 * chrome does seems to work in at-least all chromium based browsers
 */
chrome.runtime.onMessage.addListener(() => {
  runImportScripts();
  return false;
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
