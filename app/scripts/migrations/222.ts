import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 222;

/**
 * Removes the deprecated `AccountOrderController` from persisted state.
 *
 * Pin/hide preferences now live on `AccountTreeController.accountGroupsMetadata`.
 * Users who unlocked under the dual-wiring already had address-level lists seeded
 * into group metadata via `accountOrderCallbacks`.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist to disk.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;
  if (hasProperty(state, 'AccountOrderController')) {
    delete state.AccountOrderController;
    changedControllers.add('AccountOrderController');
  }
}) satisfies Migrate;

export default migrate;
