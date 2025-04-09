import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 146.1;

/**
 * This migration sets the selectedNetworkClientId to mainnet if the current selectedNetworkClientId does not exist in the networkConfigurationsByChainId object.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: VersionedData) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  versionedData.data = transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    isObject(state.NetworkController.networkConfigurationsByChainId) &&
    hasProperty(state.NetworkController, 'selectedNetworkClientId')
  ) {
    const networkState = state.NetworkController;
    const allNetworkConfigurations = Object.values(
      state.NetworkController.networkConfigurationsByChainId,
    );
    const allNetworkClientIds = allNetworkConfigurations
      .flatMap((n) =>
        isObject(n) && Array.isArray(n.rpcEndpoints) ? n.rpcEndpoints : [],
      )
      .map((e) => e.networkClientId);

    if (!allNetworkClientIds.includes(networkState.selectedNetworkClientId)) {
      state.NetworkController.selectedNetworkClientId = 'mainnet';
    }
  }
  return state;
}
