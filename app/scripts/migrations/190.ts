import type { Hex, Json } from '@metamask/utils';
import { BrowserStorageAdapter } from '../../../shared/lib/stores/browser-storage-adapter';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type TokensChainsCache = Record<
  Hex,
  {
    timestamp: number;
    data: Record<string, Json>;
  }
>;

type TokenListControllerState = {
  tokensChainsCache?: TokensChainsCache;
  preventPollingOnNetworkRestart?: boolean;
};

export const version = 190;

const CONTROLLER_NAME = 'TokenListController';
const CACHE_KEY_PREFIX = 'tokensChainsCache';

/**
 * This migration moves TokenListController's tokensChainsCache from persisted
 * state to browser.storage.local via StorageService format.
 *
 * Background:
 * - Previously, tokensChainsCache was persisted as part of the controller state
 * - Now, TokenListController uses StorageService to persist per-chain cache files
 * - This migration ensures existing users don't lose their cached token lists
 *
 * The migration:
 * 1. Reads tokensChainsCache from TokenListController state
 * 2. For each chain, saves the cache to browser.storage.local
 * 3. Clears tokensChainsCache from state (since persist: false now)
 *
 * @param versionedData - Versioned MetaMask extension state
 * @param changedControllers - Set of controller names that were modified
 */
export async function migrate(
  versionedData: VersionedData,
  changedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;

  const tokenListControllerState = versionedData.data
    .TokenListController as TokenListControllerState;

  // Check if there's data to migrate
  if (!tokenListControllerState?.tokensChainsCache) {
    return;
  }

  const chainsCache = tokenListControllerState.tokensChainsCache;
  const chainIds = Object.keys(chainsCache) as Hex[];

  if (chainIds.length === 0) {
    return;
  }

  try {
    const browserStorageAdapter = new BrowserStorageAdapter();

    let migratedChains = 0;
    for (const chainId of chainIds) {
      const cacheKey = `${CACHE_KEY_PREFIX}:${chainId}`;
      const existingCache = await browserStorageAdapter.getItem(
        CONTROLLER_NAME,
        cacheKey,
      );
      if ('result' in existingCache) {
        continue;
      }
      await browserStorageAdapter.setItem(
        CONTROLLER_NAME,
        cacheKey,
        chainsCache[chainId],
      );
      migratedChains += 1;
    }

    if (migratedChains === 0) {
      console.log(
        `Migration #${version}: All ${chainIds.length} chain(s) already migrated to StorageService`,
      );
    } else {
      console.log(
        `Migration #${version}: Migrated ${migratedChains} chain(s) from TokenListController state to StorageService`,
      );
    }

    // Clear tokensChainsCache from state since it's now persisted separately
    // The controller has persist: false for this field, so this just cleans up
    // any leftover data in state
    tokenListControllerState.tokensChainsCache = {};
    changedControllers.add('TokenListController');
  } catch (error) {
    console.error(
      `Migration #${version}: Failed to migrate tokensChainsCache to StorageService:`,
      error,
    );
    // Don't fail the migration - the cache will self-heal when fetchTokenList runs
    // Just clear the state to prevent double-storage
    tokenListControllerState.tokensChainsCache = {};
    changedControllers.add('TokenListController');
  }
}
