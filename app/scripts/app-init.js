// This file is used only for manifest version 3

// eslint-disable-next-line
const WORKER_KEEP_ALIVE_MESSAGE = 'UI_OPEN';

// Represents if importAllScripts has been run
// Variable testMode is set to true when preparing test build.
// This helps in changing service worker execution in test environment.
// eslint-disable-next-line
const testMode = false;

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
  const applyLavaMoat = true;

  loadFile('./globalthis.js');
  loadFile('./sentry-install.js');

  if (applyLavaMoat) {
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

  const fileList = [
    // The list of files is injected at build time by replacing comment below with comma separated strings of file names
    // https://github.com/MetaMask/metamask-extension/blob/496d9d81c3367931031edc11402552690c771acf/development/build/scripts.js#L406
    /** FILE NAMES */
  ];

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

importAllScripts();

/*
 * Message event listener below loads script if they are no longer available.
 * chrome below needs to be replaced by cross-browser object,
 * but there is issue in importing webextension-polyfill into service worker.
 * chrome does seems to work in at-least all chromium based browsers
 */
// eslint-disable-next-line
chrome.runtime.onMessage.addListener((message) => {
  return message.name === WORKER_KEEP_ALIVE_MESSAGE;
});
