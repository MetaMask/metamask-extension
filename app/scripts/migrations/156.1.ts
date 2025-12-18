import { hasProperty } from '@metamask/utils';
import { cloneDeep, isObject } from 'lodash';

export const version = 156.1;

/**
 * Remove `keyringsMetadata` from `KeyringController` state.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  const newState = state;

  if (
    hasProperty(newState, 'KeyringController') &&
    isObject(newState.KeyringController) &&
    hasProperty(newState.KeyringController, 'keyringsMetadata')
  ) {
    delete newState.KeyringController.keyringsMetadata;
  }

  return newState;
}
