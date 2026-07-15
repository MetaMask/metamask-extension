// This file is used only for manifest version 3

import './scripts/load/bootstrap';
import { APP_INIT_LIVENESS_METHOD } from '../shared/constants/ui-initialization';
import { ExtensionLazyListener } from './scripts/lib/extension-lazy-listener/extension-lazy-listener';

const { chrome } = globalThis;

// ---------------------------------------------------------------------------
// TEMPORARY storage-corruption investigation helpers (do not ship).
//
// MetaMask's persisted state (vault + controllers) lives in
// `chrome.storage.local`, written through `ExtensionStore` and orchestrated by
// `PersistenceManager`. This helper exercises that surface:
//
//   `debugSlowStorageWriteExperiment` writes a set of keys directly to
//   `chrome.storage.local` under a caller-supplied `id`, optionally blocking the
//   SW JS thread after dispatch. `debugReadSlowStorageWriteExperiment(id)` reads
//   those same keys back — pass the same `id` used for the write. The write and
//   read are separate calls so the service worker can be stopped/restarted in
//   between.
//
// Important: `storage.local.set()` hands the payload to the browser process over
// IPC; the disk commit runs there, off the SW JS thread, and Chrome won't kill a
// SW with in-flight extension-API I/O at an unsafe point. So blocking the JS
// thread and killing the SW does NOT tear a single write in half — expect the
// data to survive.
// ---------------------------------------------------------------------------

const DEBUG_STORAGE_WRITE_PAYLOAD_SIZE = 256 * 1024;
const DEBUG_STORAGE_WRITE_BLOCK_AFTER_DISPATCH_MS = 15_000;

type DebugSlowStorageWriteOptions = {
  blockAfterDispatchMs?: number;
  id?: string;
  payloadSize?: number;
};

type DebugSlowStorageWriteResult = {
  id: string;
  keys: {
    sentinel: string;
    payload: string;
    metadata: string;
  };
};

type DebugServiceWorkerGlobal = typeof globalThis & {
  debugReadSlowStorageWriteExperiment?: (
    id: string,
  ) => Promise<Record<string, unknown>>;
  debugSlowStorageWriteExperiment?: (
    options?: DebugSlowStorageWriteOptions,
  ) => DebugSlowStorageWriteResult;
};

function blockServiceWorker(ms: number) {
  const start = performance.now();

  while (performance.now() - start < ms) {
    // Keep the service worker JS thread busy so the storage callback cannot run.
  }
}

function getDebugStorageKeys(id: string) {
  return {
    sentinel: `debugSlowStorageWrite:${id}:sentinel`,
    payload: `debugSlowStorageWrite:${id}:payload`,
    metadata: `debugSlowStorageWrite:${id}:metadata`,
  };
}

function summarizeDebugStorageRead(
  id: string,
  result: Record<string, unknown>,
) {
  const keys = getDebugStorageKeys(id);
  const storedPayload = result[keys.payload];
  const storedMetadata = result[keys.metadata];

  return {
    id,
    keysPresent: Object.keys(result),
    expectedKeys: Object.values(keys),
    hasSentinel: keys.sentinel in result,
    hasPayload: keys.payload in result,
    hasMetadata: keys.metadata in result,
    payloadLength:
      typeof storedPayload === 'string' ? storedPayload.length : undefined,
    metadata:
      storedMetadata && typeof storedMetadata === 'object'
        ? storedMetadata
        : undefined,
  };
}

function readDebugStorageKeys(id: string): Promise<Record<string, unknown>> {
  const keys = getDebugStorageKeys(id);

  return new Promise((resolve) => {
    chrome.storage.local.get(Object.values(keys), (result) => {
      const summary = summarizeDebugStorageRead(id, result);

      console.log('[debugSlowStorageWrite] read summary', summary);

      resolve(result);
    });
  });
}

function runDebugSlowStorageWriteExperiment({
  blockAfterDispatchMs,
  id,
  keys,
  payloadSize,
}: DebugSlowStorageWriteResult & Required<DebugSlowStorageWriteOptions>) {
  const payload = 'x'.repeat(payloadSize);
  const metadata = {
    dispatchedAt: new Date().toISOString(),
    id,
    payloadLength: payload.length,
  };

  console.log('[debugSlowStorageWrite] dispatching storage write', {
    id,
    keys,
    payloadSize,
  });

  chrome.storage.local.set(
    {
      [keys.metadata]: metadata,
      [keys.payload]: payload,
      [keys.sentinel]: 'written',
    },
    () => {
      console.log('[debugSlowStorageWrite] storage.set callback fired', {
        id,
        lastError: chrome.runtime.lastError?.message,
      });

      readDebugStorageKeys(id).catch(() => undefined);
    },
  );

  console.log('[debugSlowStorageWrite] storage.set dispatched', {
    blockAfterDispatchMs,
    id,
    keys,
    payloadSize,
  });

  if (blockAfterDispatchMs > 0) {
    console.log('[debugSlowStorageWrite] blocking service worker', {
      blockAfterDispatchMs,
      id,
    });

    blockServiceWorker(blockAfterDispatchMs);

    console.log('[debugSlowStorageWrite] finished blocking service worker', {
      blockAfterDispatchMs,
      id,
    });
  }
}

(globalThis as DebugServiceWorkerGlobal).debugReadSlowStorageWriteExperiment =
  readDebugStorageKeys;

(globalThis as DebugServiceWorkerGlobal).debugSlowStorageWriteExperiment = ({
  blockAfterDispatchMs = DEBUG_STORAGE_WRITE_BLOCK_AFTER_DISPATCH_MS,
  id = `${Date.now()}`,
  payloadSize = DEBUG_STORAGE_WRITE_PAYLOAD_SIZE,
}: DebugSlowStorageWriteOptions = {}) => {
  const keys = getDebugStorageKeys(id);
  const result = { id, keys };

  console.log('[debugSlowStorageWrite] starting experiment', {
    blockAfterDispatchMs,
    id,
    keys,
    payloadSize,
  });

  runDebugSlowStorageWriteExperiment({
    blockAfterDispatchMs,
    id,
    keys,
    payloadSize,
  });

  console.log('Debug slow storage write experiment scheduled', result);
  return result;
};

// this needs to be run early so we can begin listening to these browser events
// as soon as possible
const lazyListener = new ExtensionLazyListener(chrome, {
  runtime: ['onInstalled', 'onConnect'],
});

// Set the lazy listener on globalThis.stateHooks so that other bundles can
// access it.
globalThis.stateHooks.lazyListener = lazyListener;

let runImportScriptsInitiated = false;

async function runImportScripts() {
  // Bail if we've already run importScripts
  if (runImportScriptsInitiated) {
    return;
  }
  runImportScriptsInitiated = true;

  const startImportScriptsTime = performance.now();

  // eslint-disable-next-line import-x/extensions
  await import('./scripts/background.js');

  const endImportScriptsTime = performance.now();

  // for performance metrics/reference
  console.log(
    `importScripts completed in ${
      (endImportScriptsTime - startImportScriptsTime) / 1000
    } seconds`,
  );
}

// Ref: https://stackoverflow.com/questions/66406672/chrome-extension-mv3-modularize-service-worker-js-file
// eslint-disable-next-line no-undef
self.addEventListener('install', runImportScripts);

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
 * the service worker. To ensure that runImportScripts is called, we need to call it in module
 * scope as below. To avoid having `runImportScripts()` called before installation, we only
 * call it if the serviceWorker state is 'activated'. More on service worker states here:
 * https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/state. Testing also shows
 * that whenever the already installed service worker is stopped and then restarted, the state
 * is 'activated'.
 */
// @ts-expect-error - typescript doesn't know about this
// eslint-disable-next-line no-undef
if (self.serviceWorker.state === 'activated') {
  runImportScripts();
}
