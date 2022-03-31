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
}

importAllScripts();

// Not sure why but keeping this onFetch hook seems to matter
// for the first onConnect to correctly hit in the background script
// after the service worker dies/goes idle
// eslint-disable-next-line
self.onfetch = () => console.log('ONFETCH');
