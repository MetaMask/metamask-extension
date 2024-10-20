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

enum DatabaseError {
  INVALID_STATE_ERROR = 'InvalidStateError', // happens when changing the database schema (e.g., delete an object store) and then try to access the deleted store in an existing connection,
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

  private dbReady: Promise<IDBDatabase>;

  private inMemoryCache: Record<string, unknown> | null = null;

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
    this.dbReady = this._init();
  }

  /**
   * Initializes the IndexedDB store and creates an object store if necessary.
   *
   * @private
   */
  private _init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.storeName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };

      request.onerror = () => {
        log.error('IndexedDB initialization failed.');
        reject(new Error('Failed to open IndexedDB.'));
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };
    });
  }

  /**
   * Opens the IndexedDB store in the specified transaction mode.
   *
   * @param mode - The transaction mode (readonly or readwrite).
   * @returns A promise that resolves to the object store.
   * @private
   */
  private async _getObjectStore(
    mode: IDBTransactionMode = TransactionMode.READ_ONLY,
  ): Promise<IDBObjectStore> {
    try {
      const db = await this.dbReady; // Wait for the DB to be ready
      const transaction = db.transaction([this.storeName], mode);
      return transaction.objectStore(this.storeName);
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === DatabaseError.INVALID_STATE_ERROR
      ) {
        // Handle the case where the connection is closing
        log.info(
          'Database connection was closed. Attempting to reinitialize IndexedDB.',
          error,
        );
        // Re-initialize the database connection
        this.dbReady = this._init();
        const db = await this.dbReady;
        const transaction = db.transaction([this.storeName], mode);
        return transaction.objectStore(this.storeName);
      }
      throw error; // Re-throw any other errors
    }
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
      // Cache in memory for fallback
      this.inMemoryCache = dataToStore;
      if (this.dataPersistenceFailing) {
        this.dataPersistenceFailing = false;
      }
    } catch (err) {
      // When indexDB is deleted manually and we want to recover the previous recently saved state
      if (
        err instanceof Error &&
        err.name === DatabaseError.INVALID_STATE_ERROR
      ) {
        log.info(
          'IndexedDB is not available. Falling back to in-memory cache.',
        );
        this.inMemoryCache = {
          id: STATE_KEY,
          data: state,
          meta: this.metadata,
        };
        this.mostRecentRetrievedState = this.inMemoryCache;
      }

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
      // Attempt to get state from IndexedDB
      const result = await this._readFromDB(STATE_KEY);

      if (result && !this.isEmpty(result)) {
        if (!this.isExtensionInitialized) {
          this.mostRecentRetrievedState = result;
        }
        return result;
      }

      // If IndexedDB is empty, clear mostRecentRetrievedState
      this.mostRecentRetrievedState = null;

      // Fallback to in-memory cache if IndexedDB is empty
      if (this.inMemoryCache) {
        log.info('Loaded state from in-memory cache fallback.');

        // Set mostRecentRetrievedState to the in-memory cached state
        this.mostRecentRetrievedState = this.inMemoryCache;
        return this.inMemoryCache;
      }
      // Return undefined if neither storage contains the state
      return undefined;
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
