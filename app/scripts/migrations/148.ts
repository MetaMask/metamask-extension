import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 148;

/**
 * This migration deletes properties from state which have been removed in
 * previous commits.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'AppStateController') &&
    isObject(state.AppStateController)
  ) {
    // See: https://metamask.sentry.io/issues/5975849508/events/7b2c1e15e40b4b94b08030f8b5470f36/
    delete state.AppStateController.enableEIP1559V2NoticeDismissed;
  }

  if (hasProperty(state, 'NftController') && isObject(state.NftController)) {
    // See: https://metamask.sentry.io/issues/5975849508/events/7b2c1e15e40b4b94b08030f8b5470f36/
    delete state.NftController.collectibles;
    // See: https://metamask.sentry.io/issues/5975849508/events/7b2c1e15e40b4b94b08030f8b5470f36/
    delete state.NftController.collectibleContracts;
  }

  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    hasProperty(state.PreferencesController, 'preferences') &&
    isObject(state.PreferencesController.preferences)
  ) {
    // Removed in https://github.com/MetaMask/metamask-extension/pull/23460
    // See: https://metamask.sentry.io/issues/6312710272/events/e9f738648e874c7ab7bc974a79c0a048/
    delete state.PreferencesController.preferences
      .transactionSecurityCheckEnabled;
    // Removed in https://github.com/MetaMask/metamask-extension/pull/29301
    // See: https://metamask.sentry.io/issues/6043753318/events/b610fbc6125d439190845caeba805eb1/
    delete state.PreferencesController.preferences.useRequestQueue;
  }

  return state;
}
