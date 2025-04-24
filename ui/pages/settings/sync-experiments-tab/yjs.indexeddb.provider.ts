import { Doc, encodeStateAsUpdate, applyUpdate, transact } from 'yjs';
import { uuid4 } from '@sentry/utils';

// Constants for IndexedDB
const UPDATES_STORE_NAME = 'updates';
const PREFERRED_TRIM_SIZE = 500;

/**
 * IndexedDB provider for YJS that syncs a YDoc with IndexedDB
 */
export class YjsIndexedDBProvider {
  doc: Doc;

  name: string;

  db: IDBDatabase | null = null;

  _dbref = 0;

  _dbsize = 0;

  _destroyed = false;

  _storeTimeout = 1000;

  _storeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly providerID: string;

  /**
   * @param doc - The YJS Doc to sync.
   * @param name - The name of the database (and collection).
   */
  constructor(doc: Doc, name: string) {
    this.doc = doc;
    this.name = name;
    this.providerID = uuid4();

    // Open the database
    this._openDatabase().then(() => {
      // Load initial data from database
      this._fetchUpdates().catch((err) => {
        console.error('Error syncing with IndexedDB:', err);
      });
    });

    // Setup document update handler
    this.doc.on('update', this.updateHandler);

    // Handle document destroy
    this.doc.on('destroy', () => this.destroy());
  }

  /**
   * Open the IndexedDB database connection
   */
  private async _openDatabase(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.name, 1);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(UPDATES_STORE_NAME)) {
          db.createObjectStore(UPDATES_STORE_NAME, { autoIncrement: true });
        }
      };
    });
  }

  /**
   * Set up the update handler for the document
   *
   * @param update
   * @param origin
   */
  // private _setupUpdateHandler(): void {
  updateHandler = (update: Uint8Array, origin: unknown) => {
    // Don't store updates that come from us
    if (this.db && origin !== this.providerID) {
      try {
        const transaction = this.db.transaction(
          [UPDATES_STORE_NAME],
          'readwrite',
        );
        const store = transaction.objectStore(UPDATES_STORE_NAME);
        const request = store.add(update);

        request.onsuccess = () => {
          this._dbsize += 1;
        };

        request.onerror = (event) => {
          console.error('Error storing update in IndexedDB:', event);
        };
      } catch (err) {
        console.error('Error processing document update:', err);
      }
    }
  };

  // }

  /**
   * Fetch updates from the database and apply them to the document
   */
  private async _fetchUpdates(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (!this.db || this._destroyed) {
        reject(new Error('Provider is destroyed'));
        return;
      }
      try {
        const transaction = this.db.transaction(
          [UPDATES_STORE_NAME],
          'readonly',
        );
        const store = transaction.objectStore(UPDATES_STORE_NAME);

        // Get all updates with keys greater than our last processed key
        const range = IDBKeyRange.lowerBound(this._dbref, true);
        const request = store.getAll(range);

        request.onsuccess = () => {
          const updates = request.result;

          if (updates && updates.length > 0) {
            // Apply all updates in a single transaction
            transact(
              this.doc,
              () => {
                updates.forEach((update) => {
                  applyUpdate(this.doc, update, this.providerID);
                });
              },
              this.providerID,
              false,
            );

            // Get the last key processed
            const getLastKey = store.openCursor(null, 'prev');
            getLastKey.onsuccess = (event) => {
              const cursor = (event.target as IDBRequest).result;
              if (cursor) {
                this._dbref = (cursor.key as number) + 1;
              }

              // Count total number of entries
              const countRequest = store.count();
              countRequest.onsuccess = () => {
                this._dbsize = countRequest.result;
                resolve();
              };
            };
          } else {
            resolve();
          }
        };

        request.onerror = (event) => {
          console.error('Error fetching updates from IndexedDB:', event);
          reject(new Error('Failed to fetch updates from IndexedDB'));
        };
      } catch (err) {
        console.error('Error in _fetchUpdates:', err);
        reject(err);
      }
    });
  }

  /**
   * Store the current state of the document in the database
   *
   * @param forceStore
   */
  private async _storeState(forceStore = true): Promise<void> {
    if (!this.db || this._destroyed) {
      return;
    }

    if (forceStore || this._dbsize >= PREFERRED_TRIM_SIZE) {
      try {
        const transaction = this.db.transaction(
          [UPDATES_STORE_NAME],
          'readwrite',
        );
        const store = transaction.objectStore(UPDATES_STORE_NAME);

        // Store the full document state
        const fullUpdate = encodeStateAsUpdate(this.doc);
        const addRequest = store.add(fullUpdate);

        addRequest.onsuccess = () => {
          // Delete old updates
          const range = IDBKeyRange.upperBound(this._dbref, true);
          store.delete(range);

          // Update count
          const countRequest = store.count();
          countRequest.onsuccess = () => {
            this._dbsize = countRequest.result;
          };
        };
      } catch (err) {
        console.error('Error storing state:', err);
      }
    }
  }

  /**
   * Manually trigger a state storage
   */
  async storeState(): Promise<void> {
    return this._storeState(true);
  }

  /**
   * Destroy this provider and clean up resources
   */
  async destroy(): Promise<void> {
    if (this._destroyed) {
      return;
    }

    if (this._storeTimeoutId) {
      clearTimeout(this._storeTimeoutId);
    }

    this.doc.off('update', this.updateHandler);
    this.doc.off('destroy', this.destroy);
    this._destroyed = true;

    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
