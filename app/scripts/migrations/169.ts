import { cloneDeep } from 'lodash';
import { Hex } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type PreferenceControllerState = {
  preferences: {
    smartAccountOptInForAccounts: Hex[];
  };
};

export const version = 169;

/**
 * This migration assigns the value of AppStateController `upgradeSplashPageAcknowledgedForAccounts`
 * to PreferencesController preference `smartAccountOptInForAccounts`.
 * And also deletes the AppStateController `upgradeSplashPageAcknowledgedForAccounts`.
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
    | PreferenceControllerState
    | undefined;

  const appStateControllerState = state?.AppStateController as
    | Record<string, unknown>
    | undefined;

  if (
    preferencesControllerState?.preferences &&
    appStateControllerState?.upgradeSplashPageAcknowledgedForAccounts
  ) {
    (
      preferencesControllerState as PreferenceControllerState
    ).preferences.smartAccountOptInForAccounts =
      appStateControllerState?.upgradeSplashPageAcknowledgedForAccounts as Hex[];
  }

  if (appStateControllerState?.upgradeSplashPageAcknowledgedForAccounts) {
    delete appStateControllerState?.upgradeSplashPageAcknowledgedForAccounts;
  }
}
