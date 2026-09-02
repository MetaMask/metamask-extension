import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 224;

/**
 * Removes the obsolete `canTrackWalletFundsObtained` property from
 * AppStateController state. The Wallet Funds Obtained metric and its monitor
 * have been removed.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedControllers);
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
): void {
  if (
    !hasProperty(state, 'AppStateController') ||
    !isObject(state.AppStateController)
  ) {
    return;
  }

  if (hasProperty(state.AppStateController, 'canTrackWalletFundsObtained')) {
    delete state.AppStateController.canTrackWalletFundsObtained;
    changedControllers.add('AppStateController');
  }
}
