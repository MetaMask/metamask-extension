import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 173;

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
    // See: https://metamask.sentry.io/issues/6788701192/?environment=production&project=273505&query=release%3A13.0.0&referrer=release-issue-stream#exception
    // PR: https://github.com/MetaMask/metamask-extension/pull/34252
    delete state.AppStateController.switchedNetworkNeverShowMessage;
    delete state.AppStateController.switchedNetworkDetails;
  }

  return state;
}
