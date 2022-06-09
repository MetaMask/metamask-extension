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

  const systemFiles = [];

  systemFiles.push('./globalthis.js');
  systemFiles.push('./sentry-install.js');

  if (applyLavaMoat) {
    systemFiles.push('./runtime-lavamoat.js');
    systemFiles.push('./lockdown-more.js');
    systemFiles.push('./policy-load.js');
  } else {
    systemFiles.push('./lockdown-install.js');
    systemFiles.push('./lockdown-more.js');
    systemFiles.push('./lockdown-run.js');
    systemFiles.push('./runtime-cjs.js');
  }

  const fileList = [
    // The list of files is injected at build time by replacing comment below with comma separated strings of file names
    /** FILE NAMES */
  ];

  tryImport(...systemFiles, ...fileList);

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
