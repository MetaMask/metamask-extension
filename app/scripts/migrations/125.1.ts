import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 125.1;

/**
 * This migration enables token auto-detection if the basic functionality toggle is on.
 *
 * It also removes an unused property `showTokenAutodetectModalOnUpgrade` from the app metadata controller.
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
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    state.PreferencesController.useExternalServices === true
  ) {
    state.PreferencesController.useTokenDetection = true;
  }

  if (
    hasProperty(state, 'AppMetadataController') &&
    isObject(state.AppMetadataController)
  ) {
    delete state.AppMetadataController.showTokenAutodetectModalOnUpgrade;
  }

  return state;
}
