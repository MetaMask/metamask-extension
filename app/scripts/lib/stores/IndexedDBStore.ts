import log from 'loglevel';
import { captureException } from '@sentry/browser';
import { BaseStore, MetaMaskStorageStructure } from './BaseStore';

const STATE_KEY = 'metamaskState';

enum TransactionMode {
  READ_ONLY = 'readonly',
  READ_WRITE = 'readwrite',
}

enum DatabaseError {
  INVALID_STATE_ERROR = 'InvalidStateError', // happens when changing the database schema (e.g., delete an object store) and then try to access the deleted store in an existing connection,
}

export class IndexedDBStore extends BaseStore {
  storeName: string;

  dbVersion: number;

  dbReady: Promise<IDBDatabase>;

  constructor(storeName = 'ExtensionStore', dbVersion = 1) {
    super();

    this.storeName = storeName;
    this.dbVersion = dbVersion;
    this.dbReady = this._init();
  }

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

  async set(state: MetaMaskStorageStructure): Promise<void> {
    if (!state) {
      throw new Error('MetaMask - updated state is missing');
    }

    try {
      const dataToStore = { id: STATE_KEY, state };
      await this._writeToDB(dataToStore);
    } catch (err) {
      captureException(err);
      log.error('Error setting state in IndexedDB:', err);
    }
  }

  /**
   * Retrieves the state from IndexedDB.
   *
   * @returns A promise that resolves to the stored state, or `undefined` if not found.
   */
  async get(): Promise<MetaMaskStorageStructure | null> {
    try {
      // Attempt to get state from IndexedDB
      const result = await this._readFromDB(STATE_KEY);

      if (result?.data) {
        return result;
      }

      return null;
    } catch (err) {
      log.error('Error getting state from IndexedDB:', err);
      return null;
    }
  }

  private async _writeToDB(data: Record<string, unknown>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._getObjectStore(TransactionMode.READ_WRITE)
        .then((objectStore) => {
          const request = objectStore.put(data);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
        .catch((err) => {
          return reject(err);
        });
    });
  }

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
   * Reads data from IndexedDB.
   *
   * @param id - The key of the data to read.
   * @returns A promise that resolves to the data read from the store.
   * @private
   */
  private async _readFromDB(id: string): Promise<MetaMaskStorageStructure> {
    return new Promise<MetaMaskStorageStructure>((resolve, reject) => {
      this._getObjectStore(TransactionMode.READ_ONLY)
        .then((objectStore) => {
          const request = objectStore.get(id);
          request.onsuccess = () => {
            return resolve(request.result);
          };
          request.onerror = () => reject(request.error);
        })
        .catch(reject);
    });
  }
}
