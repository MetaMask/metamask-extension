import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 123;

/**
 * This migration sets the preference `showConfirmationAdvancedDetails` to
 * `true` if the user has enabled `useNonceField` or `sendHexData`.
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

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformState(state: Record<string, any>) {
  const preferencesControllerState = state?.PreferencesController;

  if (preferencesControllerState?.preferences) {
    const isCustomNonceFieldEnabled = preferencesControllerState?.useNonceField;
    const isHexDataVisibilityEnabled =
      preferencesControllerState?.featureFlags?.sendHexData;

    preferencesControllerState.preferences.showConfirmationAdvancedDetails =
      isCustomNonceFieldEnabled || isHexDataVisibilityEnabled;
  }

  return state;
}
