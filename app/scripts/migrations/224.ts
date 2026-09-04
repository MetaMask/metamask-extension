import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 224;

/**
 * Removes the obsolete canTrackWalletFundsObtained property from
 * AppStateController.
 *
 * @param versionedData - Persisted MetaMask state.
 * @param changedControllers
 */
export const migrate = ((versionedData, changedControllers) => {
  if (removeCanTrackWalletFundsObtained(versionedData.data)) {
    changedControllers.add('AppStateController');
  }

  versionedData.meta.version = version;
}) satisfies Migrate;

const migration = { version, migrate };

export default migration;

function removeCanTrackWalletFundsObtained(
  state: Record<string, unknown>,
): boolean {
  if (
    !hasProperty(state, 'AppStateController') ||
    !isObject(state.AppStateController)
  ) {
    return false;
  }

  if (!hasProperty(state.AppStateController, 'canTrackWalletFundsObtained')) {
    return false;
  }

  delete state.AppStateController.canTrackWalletFundsObtained;
  return true;
}
