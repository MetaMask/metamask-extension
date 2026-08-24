import type { WalletOptions } from '@metamask/wallet';
import { IndexedDBStorageAdapter } from '../../../../shared/lib/stores/indexeddb-storage-adapter';
import { BrowserStorageAdapter } from '../../../../shared/lib/stores/browser-storage-adapter';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { getPlatform } from '../../lib/util';

type StorageServiceInstanceOptions =
  WalletOptions['instanceOptions']['storageService'];

const isFirefox = getPlatform() === PLATFORM_FIREFOX;
// Chrome has an issue with its `storage.local` implementation -- it doesn't
// like sharing the database with "large" keys, like Snaps source code.
// Firefox doesn't have any issues with storage stability in storage.local,
// but users are able to turn `indexedDB` completely _off_ in Firefox. We
// can reasonably fall back to storage.local in such cases, since we'd be
// missing data that once existed... and to make things more complicated,
// if a user turns `indexedDB` back on later, the old "missing" data comes
// back like it was never missing in the first place.
// So, on FireFox, we report `indexedDb` as unavailable.
const Adapter = isFirefox ? BrowserStorageAdapter : IndexedDBStorageAdapter;

/**
 * Build the extension's `StorageService` instance options. The extension uses
 * IndexedDB on chrome, with browser.storage.local.
 *
 * @returns The extension `StorageService` instance options.
 */
export function getStorageServiceInstanceOptions(): StorageServiceInstanceOptions {
  return {
    storage: new Adapter(),
  };
}
