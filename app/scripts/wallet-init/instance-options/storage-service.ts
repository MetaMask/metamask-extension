import type { WalletOptions } from '@metamask/wallet';
import { IndexedDBStorageAdapter } from '../../../../shared/lib/stores/indexeddb-storage-adapter';

type StorageServiceInstanceOptions =
  WalletOptions['instanceOptions']['storageService'];

/**
 * Build the extension's `StorageService` instance options. The extension uses
 * IndexedDB, with browser.storage.local as an availability fallback.
 *
 * @returns The extension `StorageService` instance options.
 */
export function getStorageServiceInstanceOptions(): StorageServiceInstanceOptions {
  return {
    storage: new IndexedDBStorageAdapter(),
  };
}
