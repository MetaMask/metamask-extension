import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 120.2;

/**
 * This migration removes any dangling instances of SelectedNetworkController.perDomainNetwork and SnapController.snapErrors
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
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

function removeObsoleteSnapControllerState(
  state: Record<string, unknown>,
): void {
  if (!hasProperty(state, 'SnapController')) {
    return;
  } else if (!isObject(state.SnapController)) {
    global.sentry.captureException(
      new Error(
        `Migration ${version}: Invalid SnapController state of type '${typeof state.SnapController}'`,
      ),
    );
    return;
  }

  delete state.SnapController.snapErrors;
}

function removeObsoleteSelectedNetworkControllerState(
  state: Record<string, unknown>,
): void {
  if (!hasProperty(state, 'SelectedNetworkController')) {
    return;
  }
  if (!isObject(state.SelectedNetworkController)) {
    console.error(
      `Migration ${version}: Invalid SelectedNetworkController state of type '${typeof state.SelectedNetworkController}'`,
    );
    delete state.SelectedNetworkController;
  } else if (hasProperty(state.SelectedNetworkController, 'perDomainNetwork')) {
    delete state.SelectedNetworkController;
  }
}

function transformState(state: Record<string, unknown>): void {
  removeObsoleteSnapControllerState(state);
  removeObsoleteSelectedNetworkControllerState(state);
}
