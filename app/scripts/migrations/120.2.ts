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

/**
 * Remove obsolete SnapController state
 *
 * The `snapErrors` property was never intended to be persisted, but the initial state for this
 * property was accidentally persisted for some users due to a bug. See #26280 for details.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
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

/**
 * Remove obsolete `perDomainNetwork` property from SelectedNetworkController state.
 *
 * We don't know exactly why yet, but we see from Sentry that some users have this property still
 * in state. It is no longer used.
 *
 * If we detect that the state is corrupted or that this property is present, we are fixing it by
 * erasing the state. The consequences of this state being erased are minimal, and this was easier
 * than fixing state corruption without resetting it.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
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

/**
 * Remove obsolete controller state.
 *
 * @param state - The persisted MetaMask state, keyed by controller.
 */
function transformState(state: Record<string, unknown>): void {
  removeObsoleteSnapControllerState(state);
  removeObsoleteSelectedNetworkControllerState(state);
}
