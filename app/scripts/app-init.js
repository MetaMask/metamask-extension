// eslint-disable-next-line import/unambiguous
let initialized = false;
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
// eslint-disable-next-line no-undef
chrome.runtime.onMessage.addListener((request) => {
  if (
    request.msg === 'metamask-provider' ||
    request.msg === 'stream ended' ||
    request.msg === 'dapp open'
  ) {
    console.log(
      'REQUEST METHOD:',
      request?.chunk?.data?.method,
      '&& request message:',
      request.msg,
    );
    importAllScripts();
  }
});

function importAllScripts() {
  if (!initialized) {
    const startImportScriptsTime = Date.now();
    tryImport('./globalthis.js');
    tryImport('./sentry-install.js');
    tryImport('./runtime-lavamoat.js');
    tryImport('./lockdown-more.js');
    tryImport('./policy-load.js');

    const fileList = [
      /** FILE NAMES */
    ];

    fileList.forEach((fileName) => tryImport(fileName));

    // for performance metrics/reference
    console.log(
      'SCRIPTS IMPORT COMPLETE in Seconds:',
      (Date.now() - startImportScriptsTime) / 1000,
    );
    initialized = true;
  }
}

importAllScripts();

/**
 * An open issue is changes in this file break during hot reloading. Reason is dynamic injection of "FILE NAMES".
 * Developers need to restart local server if they change this file.
 */
