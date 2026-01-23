import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 190;

/**
 * Migration that removes `null` seedWords values from the persisted state.
 *
 * If the `seedWords` property exists on the data object and its value is
 * `null`, this migration deletes the property and records `seedWords` in
 * the set of changed keys.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedKeys - A set used to record keys that were modified.
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;

  if (
    hasProperty(versionedData.data, 'seedWords') &&
    versionedData.data.seedWords === null
  ) {
    delete versionedData.data.seedWords;
    changedKeys.add('seedWords');
  }
}) satisfies Migrate;
