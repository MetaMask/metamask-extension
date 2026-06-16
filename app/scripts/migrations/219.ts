import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 219;

const PPOM_DB_NAME = 'PPOMDB';

/**
 * Migration 219: Clean up PPOMController persisted state and its IndexedDB
 * database after the PPOM Controller was removed.
 *
 * - Removes the `PPOMController` key from persisted state.
 * - Deletes the `PPOMDB` IndexedDB database that stored PPOM model data.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist
 * to disk.
 * @param changedKeys - `Set` to track which controller keys were modified.
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;

  const state = versionedData.data as Record<string, unknown>;

  if (hasProperty(state, 'PPOMController')) {
    delete state.PPOMController;
    changedKeys.add('PPOMController');
  }

  await deletePPOMDatabase();
}) satisfies Migrate;

export default migrate;

/**
 * Deletes the PPOMDB IndexedDB database. Resolves even on failure so the
 * migration is never blocked by IndexedDB issues.
 */
async function deletePPOMDatabase(): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
      const request = indexedDB.deleteDatabase(PPOM_DB_NAME);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.warn(
          `Migration #${version}: Failed to delete ${PPOM_DB_NAME} IndexedDB database`,
        );
        resolve();
      };

      request.onblocked = () => {
        console.warn(
          `Migration #${version}: Deletion of ${PPOM_DB_NAME} IndexedDB database was blocked`,
        );
        resolve();
      };
    } catch {
      // indexedDB may not be available in all contexts
      resolve();
    }
  });
}
