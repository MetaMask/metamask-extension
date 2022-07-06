// This file is used only for manifest version 3

// Represents if importAllScripts has been run
// eslint-disable-next-line
let scriptsLoaded = false;

// eslint-disable-next-line import/unambiguous
function tryImport(...fileNames) {
  try {
    // eslint-disable-next-line
    importScripts(...fileNames);
    return true;
  } catch (e) {
    console.error(e);
  }

  return false;
}

function importAllScripts() {
  // Bail if we've already imported scripts
  if (scriptsLoaded) {
    return;
  }

  const startImportScriptsTime = Date.now();
  // value of applyLavaMoat below is dynamically replaced at build time with actual value
  const applyLavaMoat = true;

  const files = ['./globalthis.js', './sentry-install.js'];

  if (applyLavaMoat) {
    files.push(
      './runtime-lavamoat.js',
      './lockdown-more.js',
      './policy-load.js',
    );
  } else {
    files.push(
      './init-globals.js',
      './lockdown-install.js',
      './lockdown-run.js',
      './lockdown-more.js',
      './runtime-cjs.js',
    );
  }

  // Mark scripts as loaded
  scriptsLoaded = true;

  // The list of files is injected at build time by replacing comment below with comma separated strings of file names
  // https://github.com/MetaMask/metamask-extension/blob/496d9d81c3367931031edc11402552690c771acf/development/build/scripts.js#L406
  // eslint-disable-next-line
  files.push(/** FILE NAMES */);

  // Import all required resources
  tryImport(...files);

  // for performance metrics/reference
  console.log(
    `SCRIPTS IMPORT COMPLETE in Seconds: ${
      (Date.now() - startImportScriptsTime) / 1000
    }`,
  );
}

// eslint-disable-next-line no-undef
self.addEventListener('install', importAllScripts);

/*
 * Message event listener below loads script if they are no longer available.
 * chrome below needs to be replaced by cross-browser object,
 * but there is issue in importing webextension-polyfill into service worker.
 * chrome does seems to work in at-least all chromium based browsers
 */
// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener(importAllScripts);
