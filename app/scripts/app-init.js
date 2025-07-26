// This file is used only for manifest version 3

// We don't usually `import` files into `app-init.js` because we need to load
// "chunks" via `importScripts`; but in this case `promise-with-resolvers` file
// is so small we won't ever have a problem with these two files being "split".
import { withResolvers } from '../../shared/lib/promise-with-resolvers';

// Represents if importAllScripts has been run
// eslint-disable-next-line
let scriptsLoadInitiated = false;
const { chrome } = globalThis;
const testMode = process.env.IN_TEST;

/**
 * @type {import('../../types/global').StateHooks}
 */
globalThis.stateHooks = globalThis.stateHooks || {};

const loadTimeLogs = [];
// eslint-disable-next-line import/unambiguous
function tryImport(...fileNames) {
  try {
    const startTime = new Date().getTime();
    // eslint-disable-next-line
    importScripts(...fileNames);
    const endTime = new Date().getTime();
    loadTimeLogs.push({
      name: fileNames[0],
      value: endTime - startTime,
      children: [],
      startTime,
      endTime,
    });

    return true;
  } catch (e) {
    console.error(e);
  }

  return false;
}

function importAllScripts() {
  // Bail if we've already imported scripts
  if (scriptsLoadInitiated) {
    return;
  }
  scriptsLoadInitiated = true;
  const files = [];

  // In testMode individual files are imported, this is to help capture load time stats
  const loadFile = (fileName) => {
    if (testMode) {
      tryImport(fileName);
    } else {
      files.push(fileName);
    }
  };

  const startImportScriptsTime = Date.now();

  // value of useSnow below is dynamically replaced at build time with actual value
  const useSnow = process.env.USE_SNOW;
  if (typeof useSnow !== 'boolean') {
    throw new Error('Missing USE_SNOW environment variable');
  }

  // value of applyLavaMoat below is dynamically replaced at build time with actual value
  const applyLavaMoat = process.env.APPLY_LAVAMOAT;
  if (typeof applyLavaMoat !== 'boolean') {
    throw new Error('Missing APPLY_LAVAMOAT environment variable');
  }

  loadFile('../scripts/sentry-install.js');
  loadFile('../scripts/lockdown-install.js');

  if (useSnow) {
    // eslint-disable-next-line no-undef
    const isWorker = !self.document;
    if (!isWorker) {
      loadFile('../scripts/snow.js');
    }

    loadFile('../scripts/use-snow.js');
  }

  // Always apply LavaMoat in e2e test builds, so that we can capture initialization stats
  if (testMode || applyLavaMoat) {
    loadFile('../scripts/runtime-lavamoat.js');
    loadFile('../scripts/lockdown-more.js');
    loadFile('../scripts/policy-load.js');
  } else {
    loadFile('../scripts/init-globals.js');
    loadFile('../scripts/lockdown-run.js');
    loadFile('../scripts/lockdown-more.js');
    loadFile('../scripts/runtime-cjs.js');
  }

  // This environment variable is set to a string of comma-separated relative file paths.
  const rawFileList = process.env.FILE_NAMES;
  const fileList = rawFileList.split(',');
  fileList.forEach((fileName) => loadFile(fileName));

  // Import all required resources
  tryImport(...files);

  const endImportScriptsTime = Date.now();

  // for performance metrics/reference
  console.log(
    `SCRIPTS IMPORT COMPLETE in Seconds: ${
      (Date.now() - startImportScriptsTime) / 1000
    }`,
  );

  // In testMode load time logs are output to console
  if (testMode) {
    console.log(
      `Time for each import: ${JSON.stringify(
        {
          name: 'Total',
          children: loadTimeLogs,
          startTime: startImportScriptsTime,
          endTime: endImportScriptsTime,
          value: endImportScriptsTime - startImportScriptsTime,
          version: 1,
        },
        undefined,
        '    ',
      )}`,
    );
  }
}

// Ref: https://stackoverflow.com/questions/66406672/chrome-extension-mv3-modularize-service-worker-js-file
// eslint-disable-next-line no-undef
self.addEventListener('install', importAllScripts);

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
  importAllScripts();
  return false;
});

/*
 * If the service worker is stopped and restarted, then the 'install' event will not occur
 * and the chrome.runtime.onMessage will only occur if it was a message that restarted the
 * the service worker. To ensure that importAllScripts is called, we need to call it in module
 * scope as below. To avoid having `importAllScripts()` called before installation, we only
 * call it if the serviceWorker state is 'activated'. More on service worker states here:
 * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/state. Testing also shows
 * that whenever the already installed service worker is stopped and then restarted, the state
 * is 'activated'.
 */
// eslint-disable-next-line no-undef
if (self.serviceWorker.state === 'activated') {
  importAllScripts();
}

/*
 * This content script is injected programmatically because
 * MAIN world injection does not work properly via manifest
 * https://bugs.chromium.org/p/chromium/issues/detail?id=634381
 */
const registerInPageContentScript = async () => {
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: 'inpage',
        matches: ['file://*/*', 'http://*/*', 'https://*/*'],
        js: ['scripts/inpage.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: true,
      },
    ]);
  } catch (err) {
    /**
     * An error occurs when app-init.js is reloaded. Attempts to avoid the duplicate script error:
     * 1. registeringContentScripts inside runtime.onInstalled - This caused a race condition
     *    in which the provider might not be loaded in time.
     * 2. await chrome.scripting.getRegisteredContentScripts() to check for an existing
     *    inpage script before registering - The provider is not loaded on time.
     */
    console.warn(`Dropped attempt to register inpage content script. ${err}`);
  }
};

/**
 * A promise that resolves when the `onInstalled` event is fired.
 *
 * @type {PromiseWithResolvers<chrome.runtime.InstalledDetails>}
 */
const deferredOnInstalledListener = withResolvers();
globalThis.stateHooks.onInstalledListener = deferredOnInstalledListener.promise;

/**
 * `onInstalled` event handler.
 *
 * On MV3 builds we must listen for this event in `app-init`, otherwise we found
 * that the listener is never called.
 * For MV2 builds, the listener is added in `background.js` instead.
 */
chrome.runtime.onInstalled.addListener(function listener(details) {
  chrome.runtime.onInstalled.removeListener(listener);
  deferredOnInstalledListener.resolve(details);
  delete globalThis.stateHooks.onInstalledListener;
});

registerInPageContentScript();
