import { hasProperty } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 141;

/**
 * This migration deletes the preference `redesignedConfirmationsEnabled` if the
 * user has existing data.
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

  if (
    preferences &&
    hasProperty(preferences, 'redesignedConfirmationsEnabled')
  ) {
    delete preferences.redesignedConfirmationsEnabled;
  }
}
