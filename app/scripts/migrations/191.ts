import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 191;

/**
 * This migration removes the `preventPollingOnNetworkRestart` property from
 * TokenListController state.
 *
 * Background:
 * - The `preventPollingOnNetworkRestart` property was used to control polling behavior
 * - This property has been removed from the TokenListController
 * - This migration cleans up the obsolete property from persisted state
 *
 * @param versionedData - Versioned MetaMask extension state
 * @param changedControllers - Set of controller names that were modified
 */
export async function migrate(
  versionedData: VersionedData,
  changedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;

  const state = versionedData.data;

  if (!hasProperty(state, 'TokenListController')) {
    return;
  }

  const tokenListControllerState = state.TokenListController;

  if (!isObject(tokenListControllerState)) {
    return;
  }

  if (hasProperty(tokenListControllerState, 'preventPollingOnNetworkRestart')) {
    delete tokenListControllerState.preventPollingOnNetworkRestart;
    changedControllers.add('TokenListController');
  }
}
