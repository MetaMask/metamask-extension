/**
 * @file ExtensionStore.ts
 *
 * This file contains the `ExtensionStore` class, which provides a wrapper around the
 * IndexedDB API to manage the persistence of MetaMask extension state. The class is
 * responsible for initializing the IndexedDB store, saving the state along with its
 * metadata, and retrieving the most recent state.
 *
 * The class handles errors during data persistence and ensures that the extension
 * operates correctly even when the IndexedDB API fails. It also reports errors to
 * Sentry for tracking persistence failures.
 *
 * Inspecting IndexedDB in Chrome DevTools:
 * 1. Open Chrome DevTools (Right-click on the page > Inspect > Application tab).
 * 2. Under the "Storage" section in the left sidebar, click on "IndexedDB".
 * 3. Locate the `ExtensionStore` database and expand it to see the object stores.
 * 4. Click on the `ExtensionStore` object store to view and inspect the saved state.
 *
 * Alternatively, you can inspect the state via the browser console using the following code:
 *
 * ```javascript
 * indexedDB.open('ExtensionStore').onsuccess = function (event) {
 *   const db = event.target.result;
 *   const transaction = db.transaction('ExtensionStore', 'readonly');
 *   const objectStore = transaction.objectStore('ExtensionStore');
 *   objectStore.getAll().onsuccess = function (e) {
 *     console.log(e.target.result);
 *   };
 * };
 * ```
 *
 * Usage:
 *
 * ```typescript
 * const extensionStore = new ExtensionStore();
 * await extensionStore.set({ key: 'value' });
 * const state = await extensionStore.get();
 * ```
 */

import log from 'loglevel';
import { captureException } from '@sentry/browser';

const STATE_KEY = 'metamaskState';

enum TransactionMode {
  READ_ONLY = 'readonly',
  READ_WRITE = 'readwrite',
}

/**
 * A wrapper around the extension's storage using IndexedDB API.
 */
export default class ExtensionStore {
  private readonly storeName: string;

  private readonly dbVersion: number;

  private metadata: Record<string, unknown> | null;

  private dataPersistenceFailing: boolean;

  private mostRecentRetrievedState: Record<string, unknown> | null;

  private isExtensionInitialized: boolean;

  /**
   * Creates an instance of the ExtensionStore.
   *
   * @param storeName - The name of the IndexedDB store.
   * @param dbVersion - The version of the IndexedDB store.
   */
  constructor(storeName = 'ExtensionStore', dbVersion = 1) {
    this.storeName = storeName;
    this.dbVersion = dbVersion;
    this.dataPersistenceFailing = false;
    this.mostRecentRetrievedState = null;
    this.isExtensionInitialized = false;
    this.metadata = null;
    this._init();
  }

  /**
   * Initializes the IndexedDB store and creates an object store if necessary.
   *
   * @private
   */
  private _init() {
    const request = indexedDB.open(this.storeName, this.dbVersion);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.storeName)) {
        db.createObjectStore(this.storeName, { keyPath: 'id' });
      }
    };

    request.onerror = () => {
      log.error('IndexedDB not supported or initialization failed.');
    };
  }

  /**
   * Opens the IndexedDB store in the specified transaction mode.
   *
   * @param mode - The transaction mode (readonly or readwrite).
   * @returns A promise that resolves to the object store.
   * @private
   */
  private _getObjectStore(
    mode: IDBTransactionMode = TransactionMode.READ_ONLY,
  ): Promise<IDBObjectStore> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.storeName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB.'));
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], mode);
        const objectStore = transaction.objectStore(this.storeName);
        resolve(objectStore);
      };
    });
  }

  /**
   * Sets metadata to be stored with the state.
   *
   * @param initMetaData - The metadata to store.
   * @returns A promise that resolves when the metadata is set.
   */
  async setMetadata(initMetaData: Record<string, unknown>): Promise<void> {
    this.metadata = initMetaData;
  }

  /**
   * Saves the current state in IndexedDB.
   *
   * @param state - The state to be saved.
   * @throws If the state or metadata is missing.
   * @returns A promise that resolves when the state is saved.
   */
  async set(state: Record<string, unknown>): Promise<void> {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }
    if (!this.metadata) {
      throw new Error(
        'MetaMask - metadata must be set on instance of ExtensionStore before calling "set"',
      );
    }

    try {
      const dataToStore = { id: STATE_KEY, data: state, meta: this.metadata };
      await this._writeToDB(dataToStore);
      if (this.dataPersistenceFailing) {
        this.dataPersistenceFailing = false;
      }
    } catch (err) {
      if (!this.dataPersistenceFailing) {
        this.dataPersistenceFailing = true;
        captureException(err);
      }
      log.error('Error setting state in IndexedDB:', err);
    } finally {
      this.isExtensionInitialized = true;
    }
  }

  /**
   * Retrieves the state from IndexedDB.
   *
   * @returns A promise that resolves to the stored state, or `undefined` if not found.
   */
  async get(): Promise<Record<string, unknown> | undefined> {
    try {
      const result = await this._readFromDB(STATE_KEY);
      if (!result || this.isEmpty(result)) {
        this.mostRecentRetrievedState = null;
        return undefined;
      }
      if (!this.isExtensionInitialized) {
        this.mostRecentRetrievedState = result;
      }
      return result;
    } catch (err) {
      log.error('Error getting state from IndexedDB:', err);
      return undefined;
    }
  }

  /**
   * Writes data to IndexedDB.
   *
   * @param data - The data to write.
   * @returns A promise that resolves when the data is written.
   * @private
   */
  private async _writeToDB(data: Record<string, unknown>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._getObjectStore(TransactionMode.READ_WRITE)
        .then((objectStore) => {
          const request = objectStore.put(data);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
        .catch(reject);
    });
  }

  /**
   * Reads data from IndexedDB.
   *
   * @param id - The key of the data to read.
   * @returns A promise that resolves to the data read from the store.
   * @private
   */
  private async _readFromDB(
    id: string,
  ): Promise<Record<string, unknown> | null> {
    return new Promise<Record<string, unknown> | null>((resolve, reject) => {
      this._getObjectStore(TransactionMode.READ_ONLY)
        .then((objectStore) => {
          const request = objectStore.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        })
        .catch(reject);
    });
  }

  /**
   * Cleans up the most recent retrieved state.
   */
  cleanUpMostRecentRetrievedState(): void {
    this.mostRecentRetrievedState = null;
  }

  /**
   * Checks if an object is empty.
   *
   * @param obj - The object to check.
   * @returns `true` if the object is empty, otherwise `false`.
   */
  isEmpty(obj: object): boolean {
    return Object.keys(obj).length === 0;
  }
}
