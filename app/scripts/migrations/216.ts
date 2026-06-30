import browser from 'webextension-polyfill';
import { STORAGE_KEY_PREFIX } from '@metamask/storage-service';
import {
  isIndexedDBMutationBlockedError,
  STORAGE_SERVICE_INDEXED_DB_NAME,
  STORAGE_SERVICE_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-adapter';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';
import type { Migrate } from './types';

export const version = 216;

type StorageServiceEntry = [string, unknown];
type BrowserStorageLocal = Pick<typeof browser.storage.local, 'get' | 'remove'>;

function getStorageServiceEntries(
  storageData: Record<string, unknown>,
): StorageServiceEntry[] {
  return Object.entries(storageData).filter(([key]) => {
    return key.startsWith(STORAGE_KEY_PREFIX);
  });
}

function getBrowserStorageLocal(): BrowserStorageLocal | undefined {
  const storageLocal = (
    browser as unknown as {
      storage?: { local?: Partial<BrowserStorageLocal> };
    }
  ).storage?.local;

  if (
    typeof storageLocal?.get !== 'function' ||
    typeof storageLocal.remove !== 'function'
  ) {
    return undefined;
  }

  return storageLocal as BrowserStorageLocal;
}

/**
 * Moves existing StorageService data from browser.storage.local to IndexedDB.
 *
 * StorageService now uses IndexedDB for extension storage, but earlier
 * migrations and releases wrote externalized StorageService values into
 * browser.storage.local. Users who already ran those migrations need this
 * follow-up migration because old migrations are not rerun.
 * @param versionedData
 */
export const migrate = (async (versionedData) => {
  versionedData.meta.version = version;

  let database: IndexedDBStore | undefined;

  try {
    const storageLocal = getBrowserStorageLocal();
    if (!storageLocal) {
      return;
    }

    const allStorage = await storageLocal.get(null);
    const storageServiceEntries = getStorageServiceEntries(allStorage);

    if (storageServiceEntries.length === 0) {
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
  } catch (error) {
    console.error(
      `Migration #${version}: Failed to migrate StorageService data to IndexedDB:`,
      error,
    );
  } finally {
    database?.close();
  }
}) satisfies Migrate;
