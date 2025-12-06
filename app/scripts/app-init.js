// app-init.js (Manifest V3 Service Worker Bootstrap)

/**
 * This file is used only for Manifest Version 3 Service Workers.
 * Its primary purpose is to:
 * 1. Initialize the ExtensionLazyListener early to catch browser events before the worker sleeps.
 * 2. Conditionally load the rest of the application scripts (chunks) using importScripts().
 */

// Import necessary utility. Small import is acceptable as per the original file's comment.
import { ExtensionLazyListener } from './lib/extension-lazy-listener/extension-lazy-listener';

const { chrome } = globalThis;

// Initialize the lazy listener immediately to start capturing critical browser events
// like 'onInstalled' and 'onConnect', ensuring the worker stays awake if necessary.
const lazyListener = new ExtensionLazyListener(chrome, {
  runtime: ['onInstalled', 'onConnect'],
});

/**
 * @type {import('../../types/global').StateHooks}
 * Global object for sharing state hooks and listeners across different bundles/chunks.
 */
globalThis.stateHooks = globalThis.stateHooks || {};
globalThis.stateHooks.lazyListener = lazyListener;

// Flag to ensure the main script loading process runs only once.
let scriptsLoadInitiated = false;
const testMode = process.env.IN_TEST;
const loadTimeLogs = [];

/**
 * Attempts to synchronously import scripts and records load time metrics.
 * @param {...string} fileNames - List of script paths to import.
 * @returns {boolean} True if import succeeded, false otherwise.
 */
function tryImport(...fileNames) {
  if (scriptsLoadInitiated) {
    // Safety check: Prevents re-importing if accidentally called multiple times.
    return true; 
  }

  try {
    const startTime = new Date().getTime();
    // Synchronous script loading in the Service Worker context.
    // eslint-disable-next-line no-undef
    importScripts(...fileNames); 
    const endTime = new Date().getTime();

    // Log performance metrics only for the first file in the list for simplicity.
    loadTimeLogs.push({
      name: fileNames[0],
      value: endTime - startTime,
      children: [],
      startTime,
      endTime,
    });

    return true;
  } catch (e) {
    console.error('Failed to import scripts:', e);
  }

  return false;
}

/**
 * Orchestrates the loading of all main application scripts based on build configuration.
 */
function importAllScripts() {
  if (scriptsLoadInitiated) {
    return;
  }
  scriptsLoadInitiated = true;
  const files = [];

  /**
   * Pushes file names to the array or imports them individually in test mode.
   * @param {string} fileName - The script path.
   */
  const loadFile = (fileName) => {
    if (testMode) {
      tryImport(fileName);
    } else {
      files.push(fileName);
    }
  };

  const startImportScriptsTime = Date.now();

  // Dynamically replaced build environment variables (assumed to be boolean literals).
  const useSnow = process.env.USE_SNOW;
  if (typeof useSnow !== 'boolean') {
    throw new Error('Build Error: USE_SNOW environment variable is missing or not a boolean literal.');
  }
  const applyLavaMoat = process.env.APPLY_LAVAMOAT;
  if (typeof applyLavaMoat !== 'boolean') {
    throw new Error('Build Error: APPLY_LAVAMOAT environment variable is missing or not a boolean literal.');
  }

  // --- Start Script Loading Order ---

  loadFile('../scripts/sentry-install.js');

  if (useSnow) {
    // Check if running in a Worker context (i.e., not a Window/Document context)
    // eslint-disable-next-line no-undef
    const isWorker = typeof self.document === 'undefined';
    if (isWorker) {
      loadFile('../scripts/snow.js'); // NOTE: Assuming this file is safe to run in a worker.
    }
    loadFile('../scripts/use-snow.js');
  }

  // Security and Runtime Setup
  const shouldApplyLavaMoat = testMode || applyLavaMoat;

  if (shouldApplyLavaMoat) {
    loadFile('../scripts/runtime-lavamoat.js');
    loadFile('../scripts/lockdown-more.js');
    loadFile('../scripts/policy-load.js');
  } else {
    // Standard (non-LavaMoat) Hardening and CJS Runtime
    loadFile('../scripts/init-globals.js');
    loadFile('../scripts/lockdown-install.js');
    loadFile('../scripts/lockdown-run.js');
    loadFile('../scripts/lockdown-more.js');
    loadFile('../scripts/runtime-cjs.js');
  }

  // Load main application bundles defined via environment variables
  const rawFileList = process.env.FILE_NAMES;
  const fileList = rawFileList.split(',');
  fileList.forEach((fileName) => loadFile(fileName));

  // If not in testMode, import all collected files in one go
  if (!testMode) {
    tryImport(...files);
  }

  const endImportScriptsTime = Date.now();

  // --- Performance Logging ---

  console.log(
    `SCRIPTS IMPORT COMPLETE in Seconds: ${(endImportScriptsTime - startImportScriptsTime) / 1000}`,
  );

  // Output detailed time logs in test mode for performance analysis
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

// --- Service Worker Event Handling ---

// 1. On initial extension installation or update, ensure all scripts are loaded.
// Ref: https://stackoverflow.com/questions/66406672/chrome-extension-mv3-modularize-service-worker-js-file
// eslint-disable-next-line no-undef
self.addEventListener('install', importAllScripts);

// 2. To handle Service Worker restarts after inactivity (where 'install' is not triggered),
// we call the script loading function in module scope. Since 'scriptsLoadInitiated'
// prevents re-runs, this is safe and guarantees the app code is loaded upon
// worker reactivation by any event (e.g., message, alarm, network request).
importAllScripts();
