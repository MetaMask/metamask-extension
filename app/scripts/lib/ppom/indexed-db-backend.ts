import { StorageBackend } from '@metamask/ppom-validator';

type StorageKey = {
  name: string;
  chainId: string;
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

export class IndexedDBPPOMStorage implements StorageBackend {
  private storeName: string;

  private dbVersion: number;

  constructor(storeName: string, dbVersion: number) {
    this.storeName = storeName;
    this.dbVersion = dbVersion;
  }

  #getObjectStore(mode: IDBTransactionMode): Promise<IDBObjectStore> {
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

  private async objectStoreAction(
    method: 'get' | 'delete' | 'put' | 'getAllKeys',
    args?: any,
    mode: IDBTransactionMode = 'readonly',
  ): Promise<any> {
    return new Promise<Event>((resolve, reject) => {
      this.#getObjectStore(mode)
        .then((objectStore) => {
          const request = objectStore[method](args);

          request.onsuccess = async (event) => {
            resolve(event);
          };

          request.onerror = (event) => {
            reject(
              new Error(
                `Error in indexDB operation ${method}: ${
                  (event.target as any)?.error
                }`,
              ),
            );
          };
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  async read(key: StorageKey, checksum: string): Promise<ArrayBuffer> {
    const event = await this.objectStoreAction('get', [key.name, key.chainId]);
    const data = (event.target as any)?.result?.data;
    await validateChecksum(key, data, checksum);
    return data;
  }

  async write(
    key: StorageKey,
    data: ArrayBuffer,
    checksum: string,
  ): Promise<void> {
    await validateChecksum(key, data, checksum);
    await this.objectStoreAction('put', { ...key, data }, 'readwrite');
  }

  async delete(key: StorageKey): Promise<void> {
    await this.objectStoreAction(
      'delete',
      [key.name, key.chainId],
      'readwrite',
    );
  }

  async dir(): Promise<StorageKey[]> {
    const event = await this.objectStoreAction('getAllKeys');
    return (event.target as any)?.result.map(([name, chainId]: string[]) => ({
      name,
      chainId,
    }));
  }
}
