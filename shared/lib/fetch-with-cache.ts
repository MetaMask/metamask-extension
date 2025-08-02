type TypedArray =
  | Int8Array
  | Uint8Array
  | Int16Array
  | Uint16Array
  | Int32Array
  | Uint32Array
  | Uint8ClampedArray
  | Float32Array
  | Float64Array;

/**
 * A type that can be cloned using structured cloning.
 * Not perfect and not exhaustive, but covers most common types.
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm#supported_types
 */
export type Cloneable =
  | string
  | number
  | boolean
  | null
  | undefined
  | ArrayBuffer
  | TypedArray
  | Blob
  | AudioData
  | DOMMatrix
  | DOMMatrixReadOnly
  | DOMQuad
  | DOMRect
  | DOMRectReadOnly
  | EncodedAudioChunk
  | EncodedVideoChunk
  | File
  | FileList
  | FileSystemDirectoryHandle
  | FileSystemFileHandle
  | FileSystemHandle
  | ImageBitmap
  | ImageData
  | RTCCertificate
  | RTCEncodedAudioFrame
  | RTCEncodedVideoFrame
  | VideoFrame
  | WebTransportError
  | CryptoKey
  | DataView
  | Date
  | Error
  | Map<Cloneable, Cloneable>
  | Set<Cloneable>
  | Cloneable[]
  | {
      [key: string | number]: Cloneable;
    };

const MEMORY_CACHE_CAPACITY = 100;
const VERSION = 1;
const memoryCache = new Map<string, { data: unknown; expiration: number }>();
const memoryCacheOrder: string[] = [];

const STORE_NAME = 'cacheStore';
const INDEXED_DB_NAME = 'fetchCacheDB';

const IDLE_TIME_MINUTES = 5;
const IDLE_TIME_MS = IDLE_TIME_MINUTES * 60 * 1000;
let evictionTimeout: NodeJS.Timeout | null = null;

const dbReadyPromise: Promise<IDBDatabase> = new Promise((resolve, reject) => {
  const request = indexedDB.open(INDEXED_DB_NAME, VERSION);
  request.onupgradeneeded = (event) => {
    const db = (event.target as IDBOpenDBRequest).result;
    if (event.oldVersion < 1) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'url' });
      store.createIndex('expirationIndex', 'expiration', { unique: false });
    }
  };
  request.onsuccess = () => {
    const db = request.result;
    resolve(db);
    cleanupExpiredDbEntries(db).catch((error) => {
      console.error('Error cleaning up expired entries on startup:', error);
    });
  };
  request.onerror = () => {
    reject(request.error);
  };
});

// Helper functions
function addToMemoryCache(url: string, data: unknown, expiration: number) {
  if (memoryCache.size >= MEMORY_CACHE_CAPACITY) {
    const oldestUrl = memoryCacheOrder.shift();
    if (oldestUrl) memoryCache.delete(oldestUrl);
  }
  // Remove url from order array if it exists
  const index = memoryCacheOrder.indexOf(url);
  if (index !== -1) {
    memoryCacheOrder.splice(index, 1);
  }
  memoryCache.set(url, { data, expiration });
  memoryCacheOrder.push(url);
}

function getMemoryCacheEntry(
  url: string,
  allowStale: boolean = false,
): { data: any; expiration: number } | null {
  const entry = memoryCache.get(url);
  if (!entry) {
    return null;
  }
  const now = Date.now();
  if (now < entry.expiration) {
    // Valid, move to end of order array
    const index = memoryCacheOrder.indexOf(url);
    if (index !== -1) {
      memoryCacheOrder.splice(index, 1);
      memoryCacheOrder.push(url);
    }
    return entry;
  } else {
    // Expired, delete it, but return it if stale data is allowed
    memoryCache.delete(url);
    const index = memoryCacheOrder.indexOf(url);
    if (index !== -1) {
      memoryCacheOrder.splice(index, 1);
    }
    if (allowStale) {
      return entry; // Return stale data
    } else {
      return null; // No valid data
    }
  }
}

export async function getDbCacheEntry(
  url: string,
): Promise<{ data: any; expiration: number } | null> {
  const db = await dbReadyPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(url);
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function setInDbCache(
  url: string,
  data: unknown,
  expiration: number,
) {
  const db = await dbReadyPromise;
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ url, data, expiration });
    request.onsuccess = () => {
      resolve();
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function cleanupExpiredDbEntries(db: IDBDatabase) {
  const now = Date.now();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const index = store.index('expirationIndex');
  const range = IDBKeyRange.upperBound(now);
  const request = index.openCursor(range);
  request.onsuccess = (event) => {
    const cursor = (event.target as IDBRequest).result;
    if (cursor) {
      cursor.delete();
      cursor.continue();
    }
  };
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function evictExpiredEntries() {
  try {
    const now = Date.now();
    // Evict from memory cache
    for (const [url, entry] of memoryCache) {
      if (entry.expiration < now) {
        memoryCache.delete(url);
        const index = memoryCacheOrder.indexOf(url);
        if (index !== -1) {
          memoryCacheOrder.splice(index, 1);
        }
      }
    }
    // Evict from IndexedDB
    const db = await dbReadyPromise;
    await cleanupExpiredDbEntries(db);
  } catch (error) {
    console.error('Error evicting expired entries:', error);
  }
}

// Main function
export default async function fetchWithCache<T>(options: {
  url: string;
  fetchOptions?: Record<string, unknown>;
  cacheOptions?: { cacheRefreshTime?: number; timeout?: number };
  functionName: string;
  allowStale?: boolean;
}): Promise<T> {
  if (evictionTimeout) {
    clearTimeout(evictionTimeout);
  }
  evictionTimeout = setTimeout(evictExpiredEntries, IDLE_TIME_MS);

  const { url, fetchOptions, cacheOptions, allowStale = false } = options;
  const cacheRefreshTime = cacheOptions?.cacheRefreshTime ?? 60 * 1000; // milliseconds, default 1 minute
  const timeout = cacheOptions?.timeout; // milliseconds, optional

  // Check in-memory cache
  const memoryEntry = getMemoryCacheEntry(url, allowStale);
  const now = Date.now();
  if (memoryEntry && now < memoryEntry.expiration) {
    return memoryEntry.data;
  }
  let staleData: T | null = memoryEntry ? memoryEntry.data : null;

  // Check IndexedDB cache
  try {
    const dbEntry = await getDbCacheEntry(url);
    if (dbEntry) {
      if (now < dbEntry.expiration) {
        addToMemoryCache(url, dbEntry.data, dbEntry.expiration);
        return dbEntry.data;
      } else {
        if (staleData === null) {
          staleData = dbEntry.data;
        }
        // Remove expired entry from IndexedDB
        const db = await dbReadyPromise;
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(url);
      }
    }
  } catch (error) {
    console.error(
      `Error accessing IndexedDB for ${options.functionName}:`,
      error,
    );
  }

  // Perform fetch
  const defaultFetchOptions = {
    mode: 'cors' as const,
    body: null,
    referrerPolicy: 'no-referrer-when-downgrade' as const,
    headers: {
      Accept: 'application/json',
    },
  };
  const { method, ...restFetchOptions } = fetchOptions || {};
  const finalFetchOptions = {
    ...defaultFetchOptions,
    ...restFetchOptions,
    method: 'GET' as const,
    headers: {
      ...defaultFetchOptions.headers,
      ...(restFetchOptions.headers || {}),
      Accept: 'application/json',
    },
  };

  let timer: NodeJS.Timeout | null = null;
  try {
    let controller: AbortController | null = null;
    if (timeout) {
      controller = new AbortController();
      timer = setTimeout(() => controller?.abort(), timeout);
    }
    const response = await fetch(url, {
      ...finalFetchOptions,
      signal: controller?.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const expiration = now + cacheRefreshTime;
    setInCaches(url, data, expiration);
    return data;
  } catch (error) {
    if (allowStale && staleData !== null) {
      return staleData;
    }
    throw error;
  } finally {
    if (timer !== null) {
      clearTimeout(timer);
    }
  }
}

export async function setInCaches(
  url: string,
  data: unknown,
  expiration: number,
) {
  addToMemoryCache(url, data, expiration);
  // fire and forget, the mem cache will protect us from any delay
  setInDbCache(url, data, expiration);
}
