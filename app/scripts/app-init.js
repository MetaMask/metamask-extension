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
  // applyLavaMoat has been hard coded to "true" as
  // tryImport('./runtime-cjs.js') is giving issue with XMLHttpRequest object which is not avaialble to service worker.
  // we need to dynamically inject values of applyLavaMoat once this is fixed.
  const applyLavaMoat = true;

  tryImport('./globalthis.js');
  tryImport('./sentry-install.js');

  if (applyLavaMoat) {
    tryImport('./runtime-lavamoat.js');
    tryImport('./lockdown-more.js');
    tryImport('./policy-load.js');
  } else {
    tryImport('./lockdown-install.js');
    tryImport('./lockdown-more.js');
    tryImport('./lockdown-run.js');
    tryImport('./runtime-cjs.js');
  }

  const fileList = [
    // The list of files is injected at build time by replacing comment below with comma separated strings of file names
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

// Placing script import call here ensures that scripts are inported each time service worker is activated.
importAllScripts();

/**
 * An open issue is changes in this file break during hot reloading. Reason is dynamic injection of "FILE NAMES".
 * Developers need to restart local server if they change this file.
 */
