/* global chrome */
// This file is used only for manifest version 3

// Represents if importAllScripts has been run
// eslint-disable-next-line
let scriptsLoadInitiated = false;

const testMode = process.env.IN_TEST;

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

  // value of applyLavaMoat below is dynamically replaced at build time with actual value
  const applyLavaMoat = process.env.APPLY_LAVAMOAT;
  if (typeof applyLavaMoat !== 'boolean') {
    throw new Error('Missing APPLY_LAVAMOAT environment variable');
  }

  loadFile('./sentry-install.js');

  // eslint-disable-next-line no-undef
  const isWorker = !self.document;
  if (!isWorker) {
    loadFile('./snow.js');
  }

  loadFile('./use-snow.js');

  // Always apply LavaMoat in e2e test builds, so that we can capture initialization stats
  if (testMode || applyLavaMoat) {
    loadFile('./runtime-lavamoat.js');
    loadFile('./lockdown-more.js');
    loadFile('./policy-load.js');
  } else {
    loadFile('./init-globals.js');
    loadFile('./lockdown-install.js');
    loadFile('./lockdown-run.js');
    loadFile('./lockdown-more.js');
    loadFile('./runtime-cjs.js');
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
        js: ['inpage.js'],
        runAt: 'document_start',
        world: 'MAIN',
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

registerInPageContentScript();

/**
 * Creates an offscreen document that can be used to load additional scripts
 * and iframes that can communicate with the extension through the chrome
 * runtime API. Only one offscreen document may exist, so any iframes required
 * by extension can be embedded in the offscreen.html file. See the offscreen
 * folder for more details.
 */
async function createOffscreen() {
  if (await chrome.offscreen.hasDocument()) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: './offscreen.html',
    reasons: ['IFRAME_SCRIPTING'],
    justification:
      'Used for Hardware Wallet and Snaps scripts to communicate with the extension.',
  });

  console.debug('Offscreen iframe loaded');
}

createOffscreen();
