export const STORAGE_SERVICE_INDEXED_DB_NAME = 'metamask-storage-service';
export const STORAGE_SERVICE_INDEXED_DB_VERSION = 1;

// This key is intentionally stored through the fallback adapter. If IndexedDB
// later becomes available, it prevents values written during the fallback
// period from being silently abandoned in browser.storage.local.
export const STORAGE_SERVICE_INDEXED_DB_FALLBACK_NAMESPACE =
  'MetaMaskIndexedDBStorageAdapter';
export const STORAGE_SERVICE_INDEXED_DB_FALLBACK_KEY = 'useBrowserStorage';
