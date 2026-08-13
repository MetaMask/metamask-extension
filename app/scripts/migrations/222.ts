import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import { isIndexedDBMutationBlockedError } from '../../../shared/lib/stores/indexeddb-storage-adapter';
import {
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY,
  STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE,
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-constants';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';
import type { Migrate } from './types';

export const version = 222;

type StorageServiceEntry = [string, unknown];
type BrowserStorageLocal = Pick<
  typeof browser.storage.local,
  'get' | 'remove' | 'set'
> & {
  getKeys?: () => Promise<string[]>;
};

const FALLBACK_MARKER_STORAGE_KEY = `${STORAGE_KEY_PREFIX}${STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE}:${STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY}`;

function getStorageServiceEntries(
  storageData: Record<string, unknown>,
): StorageServiceEntry[] {
  return Object.entries(storageData).filter(([key]) => {
    return key.startsWith(STORAGE_KEY_PREFIX);
  });
}

async function getStorageServiceEntriesFromStorageLocal(
  storageLocal: BrowserStorageLocal,
): Promise<StorageServiceEntry[]> {
  // Avoid reading all browser.storage.local values when getKeys is available
  // (Chrome 130+ and Firefox 143+).
  if (typeof storageLocal.getKeys === 'function') {
    const storageServiceKeys = (await storageLocal.getKeys()).filter((key) => {
      return key.startsWith(STORAGE_KEY_PREFIX);
    });

    if (storageServiceKeys.length === 0) {
      return [];
    }

    const storageData = await storageLocal.get(storageServiceKeys);

    return storageServiceKeys
      .filter((key) => key in storageData)
      .map((key) => [key, storageData[key]]);
  }

  const allStorage = await storageLocal.get(null);
  return getStorageServiceEntries(allStorage);
}

/**
 * Moves legacy StorageService data from browser.storage.local to IndexedDB.
 * @param versionedData
 * @param _changedKeys
 */
export const migrate = (async (versionedData, _changedKeys) => {
  versionedData.meta.version = version;

  let database: IndexedDBStore | undefined;

  try {
    const storageLocal: BrowserStorageLocal = browser.storage.local;

    const storageServiceEntries =
      await getStorageServiceEntriesFromStorageLocal(storageLocal);

    if (storageServiceEntries.length === 0) {
      return;
    }

    const hasFallbackMarker = storageServiceEntries.some(([key]) => {
      return key === FALLBACK_MARKER_STORAGE_KEY;
    });
    if (hasFallbackMarker) {
      return;
    }

    database = new IndexedDBStore();

    try {
      await database.open(
        STORAGE_SERVICE_INDEXED_DB_NAME,
        STORAGE_SERVICE_INDEXED_DB_VERSION,
      );
    } catch (error) {
      if (isIndexedDBMutationBlockedError(error)) {
        await storageLocal.set({ [FALLBACK_MARKER_STORAGE_KEY]: true });
        console.warn(
          `Migration #${version}: IndexedDB is unavailable; keeping StorageService data in browser.storage.local.`,
        );
        return;
      }

      throw error;
    }

    const storageServiceKeys = storageServiceEntries.map(([key]) => key);
    const existingValues = await database.get(storageServiceKeys);
    const entriesToMigrate = storageServiceEntries.filter((_, index) => {
      return existingValues[index] === undefined;
    });

    if (entriesToMigrate.length > 0) {
      await database.set(Object.fromEntries(entriesToMigrate));
    }

    await storageLocal.remove(storageServiceKeys);
  } finally {
    database?.close();
  }
}) satisfies Migrate;
