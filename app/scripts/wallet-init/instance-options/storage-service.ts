import type { WalletOptions } from '@metamask/wallet';
import { IndexedDBStorageAdapter } from '../../../../shared/lib/stores/indexeddb-storage-adapter';

type StorageServiceInstanceOptions =
  WalletOptions['instanceOptions']['storageService'];

/**
 * Build the extension's `StorageService` instance options. The extension
 * persists through the browser extension storage area.
 *
 * @returns The extension `StorageService` instance options.
 */
export function getStorageServiceInstanceOptions(): StorageServiceInstanceOptions {
  return {
    storage: new IndexedDBStorageAdapter(),
  };
}
