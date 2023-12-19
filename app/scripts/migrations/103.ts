import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { LedgerTransportTypes } from '../../../shared/constants/hardware-wallets';

export const version = 103;

/**
 * Sets the default ledger transport method of Ledger U2F or Ledger Live on chrome to Webhid.
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
  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    window.navigator.userAgent.includes('Chrome')
  ) {
    const preferencesControllerState = state.PreferencesController;
    preferencesControllerState.ledgerTransportType =
      LedgerTransportTypes.webhid;
    return {
      ...state,
      PreferencesController: preferencesControllerState,
    };
  }

  return state;
}
