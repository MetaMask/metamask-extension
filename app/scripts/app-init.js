// eslint-disable-next-line import/unambiguous
function tryImport(...fileNames) {
  try {
    // eslint-disable-next-line
    importScripts(...fileNames);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function importAllScripts() {
  const startImportScriptsTime = Date.now();
  // value of applyLavaMoat below is dynamically replaced at build time with actual value
  const applyLavaMoat = true;

  tryImport('./globalthis.js');
  tryImport('./sentry-install.js');

  if (applyLavaMoat) {
    tryImport('./runtime-lavamoat.js');
    tryImport('./lockdown-more.js');
    tryImport('./policy-load.js');
  } else {
    tryImport('./init-globals.js');
    tryImport('./lockdown-install.js');
    tryImport('./lockdown-run.js');
    tryImport('./lockdown-more.js');
    tryImport('./runtime-cjs.js');
  }
  // eslint-disable-next-line
  self.scriptLoaded = true;

  const fileList = [
    // The list of files is injected at build time by replacing comment below with comma separated strings of file names
    // https://github.com/MetaMask/metamask-extension/blob/496d9d81c3367931031edc11402552690c771acf/development/build/scripts.js#L406
    /** FILE NAMES */
  ];

  fileList.forEach((fileName) => tryImport(fileName));

  // for performance metrics/reference
  console.log(
    `SCRIPTS IMPORT COMPLETE in Seconds: ${
      (Date.now() - startImportScriptsTime) / 1000
    }`,
  );
}

// eslint-disable-next-line
self.oninstall = () => {
  importAllScripts();
};

/*
 * Message event listener below loads script if they are no longer available.
 * chrome below needs to be replaced by cross-browser object,
 * but there is issue in importing webextension-polyfill into service worker.
 * chrome does seems to work in at-least all chromium based browsers
 */
// eslint-disable-next-line
chrome.runtime.onMessage.addListener((_1, _2, sendResponse) => {
  // eslint-disable-next-line
  if (!self.scriptLoaded) {
    importAllScripts();
  }
});
