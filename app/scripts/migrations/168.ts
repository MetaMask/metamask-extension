import { cloneDeep } from 'lodash';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 168;

/**
 * This migration sets the preference `smartAccountOptIn` to false for existing users.
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
  const preferencesControllerState = state?.PreferencesController as
    | Record<string, unknown>
    | undefined;

  const preferences = preferencesControllerState?.preferences as
    | Record<string, unknown>
    | undefined;

  if (preferences && !getManifestFlags().testing?.enableSmartAccountOptIn) {
    preferences.smartAccountOptIn = false;
  }
}
