import { Hex } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 170.1;

/**
 * This migration deletes the preference `smartAccountOptInForAccounts`.
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
    | {
        preferences: {
          smartAccountOptInForAccounts?: Hex[];
        };
      }
    | undefined;

  if (preferencesControllerState?.preferences?.smartAccountOptInForAccounts) {
    delete preferencesControllerState.preferences.smartAccountOptInForAccounts;
  }
}
