import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 113;

/**
 * Migrates users from opensea + blockaid to blockaid only
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

function transformState(state: Record<string, any>) {
  if(!state?.PreferencesController) {
    return state;
  }

  const PreferencesController = state?.PreferencesController || {};

  const newState = {
    ...state,
    PreferencesController: {
      ...PreferencesController,
      transactionSecurityCheckEnabled: false,
      securityAlertsEnabled: true
    },
  };

  delete newState.PreferencesController.transactionSecurityCheckEnabled;

  return newState;
}
