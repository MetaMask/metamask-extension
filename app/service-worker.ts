// This file is used only for manifest version 3

import './scripts/load/bootstrap';
import { APP_INIT_LIVENESS_METHOD } from '../shared/constants/ui-initialization';
import { ExtensionLazyListener } from './scripts/lib/extension-lazy-listener/extension-lazy-listener';

const { chrome } = globalThis;

// ---------------------------------------------------------------------------
// TEMPORARY storage-corruption investigation helpers (do not ship).
//
// These helpers target `chrome.storage.local`, which is where MetaMask's real
// persisted state lives (via ExtensionStore -> PersistenceManager). The
// "corrupted/missing/damaged" reports are all about that on-disk `local`
// (LevelDB) database.
//
// Note on what this can and cannot prove: `chrome.storage.local.set()` hands the
// payload to the browser process over IPC; the actual disk commit runs off the
// service-worker JS thread. Chrome will not terminate a service worker with an
// in-flight extension-API write at an unsafe point. So blocking the JS thread
// and killing the SW does NOT tear a single `set` in half. These helpers exist
// mainly to (a) measure the correct storage area and (b) probe QUOTA / disk
// pressure, which is a genuine, reproducible loss vector (FILE_ERROR_NO_SPACE).
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

type DebugFillStorageQuotaOptions = {
  chunkSizeBytes?: number;
  maxChunks?: number;
};

type DebugFillStorageQuotaResult = {
  chunksWritten: number;
  approxBytesWritten: number;
  failedAtChunk: number | null;
  lastError: string | null;
};

type DebugServiceWorkerGlobal = typeof globalThis & {
  debugReadSlowStorageWriteExperiment?: (
    id: string,
  ) => Promise<Record<string, unknown>>;
  debugSlowStorageWriteExperiment?: (
    options?: DebugSlowStorageWriteOptions,
  ) => DebugSlowStorageWriteResult;
  debugFillStorageQuotaExperiment?: (
    options?: DebugFillStorageQuotaOptions,
  ) => Promise<DebugFillStorageQuotaResult>;
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

// Quota / disk-pressure experiment. Writes ever-larger chunks into
// `chrome.storage.local` until a `set` fails. The failing `set` reports
// `chrome.runtime.lastError` (e.g. "QUOTA_BYTES quota exceeded" or
// "FILE_ERROR_NO_SPACE ..."). This is the realistic mechanism behind
// StorageWriteErrorType.FileErrorNoSpace and behind the "state stops updating /
// reverts to older state" class of reports: once a `set` starts failing,
// PersistenceManager keeps the in-memory state advancing but the disk copy is
// frozen, so a later reload reads stale/partial data.
const DEBUG_FILL_CHUNK_SIZE_BYTES = 1024 * 1024; // 1 MiB per chunk
const DEBUG_FILL_MAX_CHUNKS = 4096;

function setLocal(items: Record<string, unknown>): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.local.set(items, () => {
      resolve(chrome.runtime.lastError?.message ?? null);
    });
  });
}

(globalThis as DebugServiceWorkerGlobal).debugFillStorageQuotaExperiment =
  async ({
    chunkSizeBytes = DEBUG_FILL_CHUNK_SIZE_BYTES,
    maxChunks = DEBUG_FILL_MAX_CHUNKS,
  }: DebugFillStorageQuotaOptions = {}): Promise<DebugFillStorageQuotaResult> => {
    const chunk = 'x'.repeat(chunkSizeBytes);
    let chunksWritten = 0;

    console.log('[debugFillStorageQuota] starting', {
      chunkSizeBytes,
      maxChunks,
    });

    for (let i = 0; i < maxChunks; i++) {
      const lastError = await setLocal({
        [`debugFillStorageQuota:${i}`]: chunk,
      });
      if (lastError) {
        const result = {
          chunksWritten,
          approxBytesWritten: chunksWritten * chunkSizeBytes,
          failedAtChunk: i,
          lastError,
        };
        console.warn('[debugFillStorageQuota] write failed', result);
        return result;
      }
      chunksWritten += 1;
      if (chunksWritten % 16 === 0) {
        console.log('[debugFillStorageQuota] progress', { chunksWritten });
      }
    }

    const result = {
      chunksWritten,
      approxBytesWritten: chunksWritten * chunkSizeBytes,
      failedAtChunk: null,
      lastError: null,
    };
    console.log('[debugFillStorageQuota] completed without failure', result);
    return result;
  };

const SAVE_TIMESTAMP_INTERVAL_MS = 2 * 1000;

function saveTimestamp() {
  const timestamp = new Date().toISOString();

  chrome.storage.session.set({ timestamp });
}

// Save the timestamp immediately and then every `SAVE_TIMESTAMP_INTERVAL_MS`.
// This keeps the service worker alive.
saveTimestamp();
setInterval(saveTimestamp, SAVE_TIMESTAMP_INTERVAL_MS);

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
if (self.serviceWorker.state === 'activated') {
  runImportScripts();
}
