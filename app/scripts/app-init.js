// This file is used only for manifest version 3

import { APP_INIT_LIVENESS_METHOD } from '../../shared/constants/ui-initialization';
// We don't usually `import` files into `app-init.js` because we need to load
// "chunks" via `importScripts`; but in this case `ExtensionLazyListener` is so
// small we won't ever have a problem with these two files being "split".
import { ExtensionLazyListener } from './lib/extension-lazy-listener/extension-lazy-listener';

const { chrome } = globalThis;

// this needs to be run early so we can begin listening to these browser events
// as soon as possible
const lazyListener = new ExtensionLazyListener(chrome, {
  runtime: ['onInstalled', 'onConnect'],
});

/**
 * @type {import('../../types/global').StateHooks}
 */
globalThis.stateHooks = globalThis.stateHooks || {};

// Set the lazy listener on globalThis.stateHooks so that other bundles can
// access it.
globalThis.stateHooks.lazyListener = lazyListener;

// Represents if importAllScripts has been run
// eslint-disable-next-line
let scriptsLoadInitiated = false;
const testMode = process.env.IN_TEST;

const loadTimeLogs = [];

/**
 * Property name when the engine threw "Cannot read properties of undefined (reading 'x')".
 *
 * @param {string} message - Error message.
 * @returns {string | undefined}
 */
function extractPropertyReadFromTypeErrorMessage(message) {
  const m = message.match(
    /Cannot read properties of (?:undefined|null) \(reading '([^']+)'\)/u,
  );
  return m ? m[1] : undefined;
}

/**
 * First stack frame that points at a Browserify chunk under the extension root.
 *
 * @param {string} stack - Full stack string.
 * @returns {{ file: string, line: string, column: string } | null}
 */
function parseFirstChunkStackFrame(stack) {
  const re =
    /(common-\d+\.js|background-\d+\.js|ui-\d+\.js|content-script-\d+\.js|offscreen-\d+\.js):(\d+):(\d+)/u;
  const match = stack.match(re);
  if (match === null) {
    return null;
  }
  return {
    file: match[1],
    line: match[2],
    column: match[3],
  };
}

/**
 * Extra hints: which property was undefined, and how to map chunk+line to node_modules path.
 *
 * @param {unknown} error - Thrown value.
 */
function logImportScriptsResolutionHints(error) {
  const message =
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : '';
  const propertyRead = extractPropertyReadFromTypeErrorMessage(message);
  if (propertyRead !== undefined) {
    console.error(
      `MetaMask app-init: The base value was null/undefined when reading property '${propertyRead}' (from the error message).`,
    );
  }

  const stack = error instanceof Error ? error.stack : undefined;
  if (stack === undefined || typeof stack !== 'string') {
    return;
  }

  const frame = parseFirstChunkStackFrame(stack);
  if (frame === null) {
    return;
  }

  console.error(
    'MetaMask app-init: The stack points at a Browserify chunk (many packages). Map it to a real file (often under node_modules) using source maps:',
  );
  console.error(
    `  yarn resolve-chunk-frame chrome ${frame.file} ${frame.line} ${frame.column}`,
  );
  console.error(
    'MetaMask app-init: Use firefox instead of chrome if that matches your dist. The CLI reads dist/sourcemaps/*.map or an inline map at the end of the chunk under dist/<platform>/. If lookup fails, retry with column minus 1.',
  );
}

/**
 * Log importScripts errors with fields DevTools often hides when printing the raw value.
 *
 * @param {string} context - Where the failure occurred.
 * @param {unknown} error - Thrown value (Error, DOMException, string, etc.).
 */
function logImportScriptsFailure(context, error) {
  /** @type {Record<string, unknown>} */
  const details = { string: String(error) };
  if (error !== null && typeof error === 'object') {
    if ('message' in error) {
      details.message = error.message;
    }
    if ('name' in error) {
      details.name = error.name;
    }
    if ('code' in error) {
      details.code = error.code;
    }
  }
  console.error(`MetaMask app-init: ${context}`, details);
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
  logImportScriptsResolutionHints(error);
}

// eslint-disable-next-line import-x/unambiguous
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
  } catch (error) {
    if (fileNames.length > 1) {
      logImportScriptsFailure(
        'Original error from the batched importScripts call',
        error,
      );
      console.error(
        'MetaMask app-init: importScripts runs scripts in order until one throws; scripts listed earlier in the batch may have already executed. Re-importing the same URLs in this worker would double-run them and can cause misleading errors (e.g. duplicate const). Use the stack trace above — the failing bundle is usually the first frame under your extension (e.g. common-*.js or background-*.js), not app-init.js.',
      );
      return false;
    }

    let scriptSummary;
    if (fileNames.length === 0) {
      scriptSummary = '(no script paths)';
    } else {
      scriptSummary = fileNames[0];
    }
    console.error(
      `MetaMask app-init: importScripts failed while loading ${scriptSummary}.`,
    );
    logImportScriptsFailure('Error from importScripts for that load', error);
    return false;
  }
}

function importAllScripts() {
  // Bail if we've already imported scripts
  if (scriptsLoadInitiated) {
    return;
  }
  scriptsLoadInitiated = true;
  const files = [];
  let scriptImportsOk = true;

  // In testMode individual files are imported, this is to help capture load time stats
  const loadFile = (fileName) => {
    if (testMode) {
      scriptImportsOk = tryImport(fileName) && scriptImportsOk;
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
    loadFile('../scripts/lockdown-install.js');
    loadFile('../scripts/lockdown-run.js');
    loadFile('../scripts/lockdown-more.js');
    loadFile('../scripts/runtime-cjs.js');
  }

  // This environment variable is set to a string of comma-separated relative file paths.
  const rawFileList = process.env.FILE_NAMES;
  const fileList = rawFileList.split(',');
  fileList.forEach((fileName) => loadFile(fileName));

  // Import all required resources
  scriptImportsOk = tryImport(...files) && scriptImportsOk;

  const endImportScriptsTime = Date.now();

  // for performance metrics/reference (only when every import succeeded)
  if (scriptImportsOk) {
    console.log(
      `SCRIPTS IMPORT COMPLETE in Seconds: ${
        (Date.now() - startImportScriptsTime) / 1000
      }`,
    );
  } else {
    console.error(
      'MetaMask app-init: Not logging "SCRIPTS IMPORT COMPLETE" because one or more importScripts calls failed; see errors above.',
    );
  }

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

// listen for connection events from other contexts, and respond to liveness
// checks, and ping them to let them know we're listening.
chrome.runtime.onConnect.addListener((port) => {
  console.log(
    'MetaMask service worker: Received connection from port',
    port.name,
  );
  try {
    // `handleOnConnect` can be called asynchronously, well after the `onConnect`
    // event was emitted, due to the lazy listener setup in `service-worker.ts`, so we
    // might not be able to send this message if the window has already closed.
    port.postMessage({
      data: {
        method: APP_INIT_LIVENESS_METHOD,
      },
      name: 'app-init-liveness',
    });
  } catch (e) {
    console.error(
      'MetaMask - app-init-liveness check: Failed to message to port',
      e,
    );
  }
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
