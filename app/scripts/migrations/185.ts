import { cloneDeep } from 'lodash';
import localforage from 'localforage';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 185;

/**
 * This migration cleans up cached fetch data for historical price API calls.
 * Removes IndexedDB (localforage) entries that match the pattern
 * 'cachedFetch:https://price.api.cx.metamask.io/v1/chains/'.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;

  try {
    // Clean up IndexedDB (localforage) entries - this is where fetchWithCache actually stores data
    const allKeys = await localforage.keys();
    const keysToRemove = allKeys.filter((key) =>
      key.startsWith('cachedFetch:https://price.api.cx.metamask.io/v1/chains/'),
    );

    // Remove the matching keys from IndexedDB
    await Promise.all(keysToRemove.map((key) => localforage.removeItem(key)));

    console.log(
      `Migration #${version}: Cleaned up ${keysToRemove.length} cache entries for historical price API`,
    );
  } catch (error) {
    console.warn(`Migration #${version}: Could not access localforage:`, error);
    // Continue with migration even if localforage cleanup fails
  }

  return versionedData;
}
