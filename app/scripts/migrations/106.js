import { cloneDeep } from 'lodash';

export const version = 106;

/**
 * This migration set preference securityAlertsEnabled to true.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 */
export async function migrate(originalVersionedData) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  const state = versionedData.data;
  const newState = transformState(state);
  versionedData.data = newState;
  return versionedData;
}

function transformState(state) {
  const PreferencesController = state?.PreferencesController || {};

  return {
    ...state,
    PreferencesController: {
      ...PreferencesController,
      securityAlertsEnabled:
        PreferencesController.transactionSecurityCheckEnabled !== true,
    },
  };
}
