import { isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

export const version = 91;

/**
 * Remove the now-obsolete preferences controller `transactionSecurityCheckEnabled` state
 * and migrate to the new `securityAlertsEnabled`
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
  if (!isObject(state.PreferencesController)) {
    return state;
  }

  if (!state.PreferencesController.transactionSecurityCheckEnabled) {
    return state;
  }

  state.PreferencesController.securityAlertsEnabled =
    state.PreferencesController.transactionSecurityCheckEnabled;

  delete state.PreferencesController.transactionSecurityCheckEnabled;

  return state;
}
