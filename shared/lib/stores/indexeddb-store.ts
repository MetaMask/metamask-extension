/**
 * Wraps an IndexedDB transaction in a promise that resolves on completion or rejects on error/abort.
 *
 * @param tx
 */
function transactionPromise(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    // `abort` has to be handled separately from `error`. When a transaction
    // fails while *committing* - a failed flush to disk, or quota exhaustion at
    // commit time - every request has already completed and been removed from
    // the transaction's request list, so no `error` event is fired at any
    // request and none bubbles up to the transaction. Only `abort` fires.
    // Requesting strict durability is what makes those commit failures
    // observable, so without this handler the promise would never settle.
    // `tx.error` is `null` for an explicitly aborted transaction, hence the
    // fallback error.
    tx.onabort = () =>
      reject(
        tx.error ??
          new DOMException('IndexedDB transaction aborted', 'AbortError'),
      );
  });
}

type IndexedDBStoreOptions = {
  /**
   * Request `durability: 'strict'` for `set`, `remove` and `reset`, so those
   * operations only resolve once the write has been flushed to disk. Defaults
   * to `false`, which leaves the browser default in place (`relaxed` in
   * Chromium 121+).
   */
  strictDurability?: boolean;
};

/**
 * Store for managing IndexedDB operations in an objectStore named `store`.
 * Backs both the critical-state backup (`metamask-backup`) and the general
 * StorageService database.
 */
export class IndexedDBStore {
  #db: IDBDatabase | null = null;

  readonly #strictDurability: boolean;

  /**
   * @param options - Store options.
   * @param options.strictDurability - Whether writes should wait for the data
   * to be flushed to disk before resolving. Off by default.
   */
  constructor({ strictDurability = false }: IndexedDBStoreOptions = {}) {
    this.#strictDurability = strictDurability;
  }

  /**
   * Opens a readwrite transaction on the `store` object store.
   *
   * When this store was constructed with `strictDurability`, the transaction
   * requests `durability: 'strict'` so that the commit waits for the write to
   * reach disk. Every browser version this extension supports implements the
   * `durability` option (Chrome 83+, Firefox 126+, Safari 15+; see
   * https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/durability#browser_compatibility),
   * and per WebIDL an engine that did not would ignore the unknown option
   * rather than throw — the dictionary conversion algorithm only reads
   * declared members (see
   * https://webidl.spec.whatwg.org/#es-dictionary), so no fallback branch
   * is needed.
   *
   * @returns A readwrite IndexedDB transaction on the `store` object store.
   */
  #readWriteTransaction(): IDBTransaction {
    if (!this.#db) {
      throw new Error('Database is not open');
    }
    if (!this.#strictDurability) {
      return this.#db.transaction('store', 'readwrite');
    }
    return this.#db.transaction('store', 'readwrite', {
      durability: 'strict',
    });
  }

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
    const keys = Object.keys(values);
    const tx = this.#readWriteTransaction();
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

  async getKeys(prefix: string): Promise<string[]> {
    if (!this.#db) {
      throw new Error('Database is not open');
    }
    const tx = this.#db.transaction('store', 'readonly');
    const store = tx.objectStore('store');

    const request = store.getAllKeys(
      IDBKeyRange.bound(prefix, `${prefix}\uffff`),
    );
    const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await transactionPromise(tx);
    return keys.filter((key): key is string => typeof key === 'string');
  }

  async remove(keys: string[]): Promise<void> {
    const tx = this.#readWriteTransaction();
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
    const tx = this.#readWriteTransaction();
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
