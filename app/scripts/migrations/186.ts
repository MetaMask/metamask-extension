import { cloneDeep } from 'lodash';
import browser from 'webextension-polyfill';
import type { Hex } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type TokensChainsCache = Record<
  Hex,
  {
    timestamp: number;
    data: Record<string, unknown>;
  }
>;

type TokenListControllerState = {
  tokensChainsCache?: TokensChainsCache;
  preventPollingOnNetworkRestart?: boolean;
};

export const version = 186;

// Storage key constants matching TokenListController and StorageService
const STORAGE_KEY_PREFIX = 'storageService:';
const CONTROLLER_NAME = 'TokenListController';
const CACHE_KEY_PREFIX = 'tokensChainsCache';

/**
 * Build the full storage key for a chain's token list cache.
 *
 * @param chainId - The chain ID (hex string like '0x1')
 * @returns Full storage key: storageService:TokenListController:tokensChainsCache:{chainId}
 */
function makeStorageKey(chainId: string): string {
  return `${STORAGE_KEY_PREFIX}${CONTROLLER_NAME}:${CACHE_KEY_PREFIX}:${chainId}`;
}

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
 * @param originalVersionedData - Versioned MetaMask extension state
 * @returns Updated versioned MetaMask extension state
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  const tokenListControllerState = versionedData.data
    .TokenListController as TokenListControllerState;

  // Check if there's data to migrate
  if (!tokenListControllerState?.tokensChainsCache) {
    return versionedData;
  }

  const chainsCache = tokenListControllerState.tokensChainsCache;
  const chainIds = Object.keys(chainsCache) as Hex[];

  if (chainIds.length === 0) {
    return versionedData;
  }

  try {
    // Check which chains already exist in storage (don't overwrite)
    const existingKeys = await browser.storage.local.get(
      chainIds.map(makeStorageKey),
    );

    // Filter to chains that need migration (not already in storage)
    const chainsToMigrate = chainIds.filter((chainId) => {
      const storageKey = makeStorageKey(chainId);
      return !(storageKey in existingKeys);
    });

    if (chainsToMigrate.length === 0) {
      console.log(
        `Migration #${version}: All ${chainIds.length} chain(s) already migrated to StorageService`,
      );
    } else {
      // Build the storage object for all chains to migrate
      const storageData: Record<string, unknown> = {};
      for (const chainId of chainsToMigrate) {
        const storageKey = makeStorageKey(chainId);
        storageData[storageKey] = chainsCache[chainId];
      }

      // Save all chains to browser.storage.local in a single call
      await browser.storage.local.set(storageData);

      console.log(
        `Migration #${version}: Migrated ${chainsToMigrate.length} chain(s) from TokenListController state to StorageService`,
      );
    }

    // Clear tokensChainsCache from state since it's now persisted separately
    // The controller has persist: false for this field, so this just cleans up
    // any leftover data in state
    tokenListControllerState.tokensChainsCache = {};
  } catch (error) {
    console.error(
      `Migration #${version}: Failed to migrate tokensChainsCache to StorageService:`,
      error,
    );
    // Don't fail the migration - the cache will self-heal when fetchTokenList runs
    // Just clear the state to prevent double-storage
    tokenListControllerState.tokensChainsCache = {};
  }

  return versionedData;
}

export default { version, migrate };
