import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 224;

/**
 * Removes the obsolete canTrackWalletFundsObtained property from
 * AppStateController. Wallet funds obtained tracking was removed from the
 * extension.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (removeCanTrackWalletFundsObtained(versionedData.data)) {
    changedControllers.add('AppStateController');
  }
}) satisfies Migrate;

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
