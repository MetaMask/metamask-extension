type StorageKey = {
  name: string;
  chainId: string;
};

type StorageBackend = {
  read(key: StorageKey, checksum: string): Promise<ArrayBuffer>;
  write(key: StorageKey, data: ArrayBuffer, checksum: string): Promise<void>;
  delete(key: StorageKey): Promise<void>;
  dir(): Promise<StorageKey[]>;
};

const validateChecksum = async (
  key: StorageKey,
  data: ArrayBuffer,
  checksum: string,
) => {
  const hash = await crypto.subtle.digest('SHA-256', data);
  const hashString = Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (hashString !== checksum) {
    throw new Error(`Checksum mismatch for key ${key}`);
  }
};

export class IndexedDBBackend implements StorageBackend {
  private storeName: string;

  private dbVersion: number;

  constructor(storeName: string, dbVersion: number) {
    this.storeName = storeName;
    this.dbVersion = dbVersion;
  }

  private async _getObjectStore(
    mode: IDBTransactionMode,
  ): Promise<IDBObjectStore> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.storeName, this.dbVersion);

      request.onerror = (event: Event) => {
        reject(
          new Error(
            `Failed to open database ${this.storeName}: ${
              (event.target as any)?.error
            }`,
          ),
        );
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, {
            keyPath: ['name', 'chainId'],
          });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction([this.storeName], mode);
        const objectStore = transaction.objectStore(this.storeName);
        resolve(objectStore);
      };
    });
  }

  async read(key: StorageKey, checksum: string): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      this._getObjectStore('readonly')
        .then((objectStore) => {
          const request = objectStore.get([key.name, key.chainId]);

          request.onsuccess = async (event) => {
            const data = (event.target as any)?.result?.data;
            await validateChecksum(key, data, checksum).catch((error) => {
              reject(error);
            });
            resolve(data);
          };

          request.onerror = (event) => {
            reject(
              new Error(`Error reading data: ${(event.target as any)?.error}`),
            );
          };
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async write(
    key: StorageKey,
    data: ArrayBuffer,
    checksum: string,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      validateChecksum(key, data, checksum)
        .then(() => {
          this._getObjectStore('readwrite')
            .then((objectStore) => {
              const request = objectStore.put({ ...key, data });

              request.onsuccess = () => {
                resolve();
              };

              request.onerror = (event) => {
                reject(
                  new Error(
                    `Error writing data: ${(event.target as any)?.error}`,
                  ),
                );
              };
            })
            .catch((error) => {
              reject(error);
            });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  public async delete(key: StorageKey): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this._getObjectStore('readwrite')
        .then((objectStore) => {
          const request = objectStore.delete([key.name, key.chainId]);

          request.onsuccess = () => {
            resolve();
          };

          request.onerror = (event) => {
            reject(
              new Error(`Error deleting data: ${(event.target as any)?.error}`),
            );
          };
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  public async dir(): Promise<StorageKey[]> {
    return new Promise<StorageKey[]>((resolve, reject) => {
      this._getObjectStore('readwrite')
        .then((objectStore) => {
          const request = objectStore.getAllKeys();

          request.onsuccess = (event) => {
            resolve(
              (event.target as any)?.result.map(
                ([name, chainId]: string[]) => ({
                  name,
                  chainId,
                }),
              ),
            );
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error saving binary data: ${(event.target as any)?.error}`,
              ),
            );
          };
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}
