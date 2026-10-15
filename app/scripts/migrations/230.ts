import { hasProperty } from '@metamask/utils';
import {
  BACKUP_INDEXED_DB_NAME,
  BACKUP_INDEXED_DB_VERSION,
} from '../../../shared/lib/stores/indexeddb-storage-constants';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';
import type { Migrate } from './types';

export const version = 230;

/**
 * Deletes the residual `MetaMetricsController` key from persisted state, and
 * the orphaned `MetaMetricsController` record from the IndexedDB backup
 * database (best-effort).
 *
 * The controller was replaced by `AnalyticsController`; earlier migrations
 * (212-229) moved every field out, leaving an empty object behind. Users who
 * never had the key are unaffected.
 *
 * `MetaMetricsController` was also removed from `backedUpStateKeys`, so the
 * backup store no longer writes or reads its record; any existing record
 * would otherwise remain there forever. The backup removal is therefore
 * best-effort: any failure (e.g. IndexedDB being unavailable in Firefox
 * private browsing mode) is swallowed so that the state migration is never
 * reported as failed. It is intentionally not gated on the presence of the
 * app-state key, since the backup record can outlive it.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (hasProperty(data, 'MetaMetricsController')) {
    delete data.MetaMetricsController;
    changedControllers.add('MetaMetricsController');
  }

  const database = new IndexedDBStore();
  try {
    await database.open(BACKUP_INDEXED_DB_NAME, BACKUP_INDEXED_DB_VERSION);
    await database.remove(['MetaMetricsController']);
  } catch (error) {
    console.warn(
      `Migration ${version}: Failed to remove the orphaned MetaMetricsController record from the '${BACKUP_INDEXED_DB_NAME}' database:`,
      error,
    );
  } finally {
    database.close();
  }
}) satisfies Migrate;
