/**
 * Wraps an IndexedDB transaction in a promise that resolves on completion or rejects on error/abort.
 *
 * @param tx
 */
function transactionPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Store for managing IndexedDB operations in an objectStore named `store`.
 * Used for storing backups of the critical parts of the extension state.
 */
export class IndexedDBStore {
  #db: IDBDatabase | null = null;

  /**
   * Opens the database, running migrations if necessary.
   *
   * @param name - The name of the database.
   * @param version - The version of the database.
   */
  async open(name: string, version: number): Promise<void> {
    if (this.#db) {
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, version);
      request.onupgradeneeded = async () => {
        const db = request.result;
        // Default migration: create the 'store' object store if it doesn't exist
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };
      request.onsuccess = () => {
        this.#db = request.result;
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Sets multiple key-value pairs atomically with exclusive locks on the keys.
   *
   * @param values - An object containing key-value pairs to set.
   */
  async set(values: Record<string, unknown>): Promise<void> {
    if (!this.#db) {
      throw new Error('Database is not open');
    }
    const keys = Object.keys(values);
    const tx = this.#db.transaction('store', 'readwrite');
    const store = tx.objectStore('store');
    for (const key of keys) {
      store.put(values[key], key);
    }
    await transactionPromise(tx);
  }

  /**
   * Gets values for multiple keys with shared locks, preserving order and duplicates.
   *
   * @param keys - An array of keys to retrieve.
   * @returns An array of values in the same order as the input keys.
   */
  async get(keys: string[]): Promise<unknown[]> {
    if (!this.#db) {
      throw new Error('Database is not open');
    }
    const uniqueKeys = [...new Set(keys)];
    const tx = this.#db.transaction('store', 'readonly');
    const store = tx.objectStore('store');
    const requests = uniqueKeys.map((key) => store.get(key));
    const results = await Promise.all(
      requests.map(
        (req) =>
          new Promise((resolve, reject) => {
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          }),
      ),
    );
    await transactionPromise(tx);
    const resultMap = new Map(
      uniqueKeys.map((key, index) => [key, results[index]]),
    );
    return keys.map((key) => resultMap.get(key));
  }

  async remove(keys: string[]): Promise<void> {
    if (!this.#db) {
      throw new Error('Database is not open');
    }
    const tx = this.#db.transaction('store', 'readwrite');
    const store = tx.objectStore('store');
    for (const key of keys) {
      store.delete(key);
    }
    await transactionPromise(tx);
  }

  /**
   * Resets the database by clearing all data in the 'store' object store.
   */
  async reset(): Promise<void> {
    if (!this.#db) {
      throw new Error('Database is not open');
    }
    const tx = this.#db.transaction('store', 'readwrite');
    const store = tx.objectStore('store');
    store.clear();
    await transactionPromise(tx);
  }

  /**
   * Closes the database connection.
   */
  close() {
    if (this.#db) {
      this.#db.close();
      this.#db = null;
    }
  }
}
