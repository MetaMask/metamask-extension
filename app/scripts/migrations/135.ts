import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { infuraProjectId } from '../../../shared/constants/network';

export const version = 135;
const BASE_CHAIN_ID = '0x2105';

/**
 * Replace all occurrences of "https://mainnet.base.org" with
 * "https://base-mainnet.infura.io/v3/${infuraProjectId}" in the Base network configuration.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
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
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'networkConfigurationsByChainId') &&
    isObject(state.NetworkController.networkConfigurationsByChainId)
  ) {
    const { networkConfigurationsByChainId } = state.NetworkController;

    // Check for Base network configuration (chainId 8453 / 0x2105)
    const baseNetworkConfig = networkConfigurationsByChainId[BASE_CHAIN_ID];
    if (isObject(baseNetworkConfig)) {
      const { rpcEndpoints } = baseNetworkConfig;

      if (Array.isArray(rpcEndpoints)) {
        // Find the first occurrence of "https://mainnet.base.org"
        // rpc URL are Unique so we can use findIndex
        const index = rpcEndpoints.findIndex(
          (endpoint) =>
            isObject(endpoint) && endpoint.url === 'https://mainnet.base.org',
        );

        if (index !== -1) {
          // Set `showBaseNetworkToast` based on if the Base network configuration has been updated
          if (
            hasProperty(state, 'PreferencesController') &&
            isObject(state.PreferencesController) &&
            hasProperty(state.PreferencesController, 'preferences') &&
            isObject(state.PreferencesController.preferences)
          ) {
            state.PreferencesController.preferences.showBaseNetworkToast = true;
          }

          // Replace the URL with the new Infura URL
          rpcEndpoints[index] = {
            ...rpcEndpoints[index],
            url: `https://base-mainnet.infura.io/v3/${infuraProjectId}`,
          };

          // Update the configuration
          networkConfigurationsByChainId[BASE_CHAIN_ID] = {
            ...baseNetworkConfig,
            rpcEndpoints,
          };

          return {
            ...state,
            NetworkController: {
              ...state.NetworkController,
              networkConfigurationsByChainId,
            },
          };
        }
      }
    }
  }

  return state;
}
