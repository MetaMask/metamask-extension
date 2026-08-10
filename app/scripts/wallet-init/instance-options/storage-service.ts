import type { Json } from '@metamask/utils';
import type { WalletOptions } from '@metamask/wallet';
import { getManifestFlags } from '../../../../shared/lib/manifestFlags';
import { getBooleanFeatureFlag } from '../../../../shared/lib/remote-feature-flag-utils';
import { BrowserStorageAdapter } from '../../../../shared/lib/stores/browser-storage-adapter';
import {
  IndexedDBStorageAdapter,
} from '../../../../shared/lib/stores/indexeddb-storage-adapter';
import { STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG } from '../../../../shared/lib/stores/indexeddb-storage-constants';

type StorageServiceInstanceOptions =
  WalletOptions['instanceOptions']['storageService'];

/**
 * Build the extension's `StorageService` instance options. The extension
 * persists through the browser extension storage area.
 *
 * @param options - Options bag.
 * @param options.state - Initial persisted controller state.
 * @returns The extension `StorageService` instance options.
 */
export function getStorageServiceInstanceOptions({
  state,
}: {
  state: Record<string, Record<string, Json>>;
}): StorageServiceInstanceOptions {
  const persistedRemoteFeatureFlags = state.RemoteFeatureFlagController
    ?.remoteFeatureFlags as Record<string, Json> | undefined;
  const manifestFlag =
    getManifestFlags().remoteFeatureFlags?.[
      STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG
    ];
  const isIndexedDBEnabled = getBooleanFeatureFlag(
    manifestFlag ??
      persistedRemoteFeatureFlags?.[
        STORAGE_SERVICE_INDEXED_DB_FEATURE_FLAG
      ],
    false,
  );

  return {
    storage: isIndexedDBEnabled
      ? new IndexedDBStorageAdapter()
      : new BrowserStorageAdapter(),
  };
}
