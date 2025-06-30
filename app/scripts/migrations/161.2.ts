import { hasProperty, isObject } from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import {
  allowedInfuraHosts,
  CHAIN_IDS,
  infuraChainIdsTestNets,
  infuraProjectId,
} from '../../../shared/constants/network';

export const version = 161.2;
const BSC_CHAIN_ID = '0x38';

/**
 * Replace all occurrences of "https://bsc-dataseed.binance.org" with
 * "https://bsc-mainnet.infura.io/v3/${infuraProjectId}" in the BSC network configuration,
 * if the user already relies on at least one Infura RPC endpoint.
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

    // Check if at least one network uses an Infura RPC endpoint, excluding testnets
    const usesInfura = Object.entries(networkConfigurationsByChainId)
      .filter(
        ([chainId]) =>
          ![...infuraChainIdsTestNets, CHAIN_IDS.LINEA_MAINNET].includes(
            chainId,
          ),
      )
      .some(([, networkConfig]) => {
        if (
          !isObject(networkConfig) ||
          !Array.isArray(networkConfig.rpcEndpoints) ||
          typeof networkConfig.defaultRpcEndpointIndex !== 'number'
        ) {
          return false;
        }

        // Get the default RPC endpoint used by the network
        const defaultRpcEndpoint =
          networkConfig?.rpcEndpoints?.[networkConfig?.defaultRpcEndpointIndex];

        if (
          !isObject(defaultRpcEndpoint) ||
          typeof defaultRpcEndpoint.url !== 'string'
        ) {
          return false;
        }

        try {
          const urlHost = new URL(defaultRpcEndpoint.url).host;
          return (
            defaultRpcEndpoint.type === RpcEndpointType.Infura ||
            allowedInfuraHosts.includes(urlHost)
          );
        } catch {
          return false;
        }
      });

    if (!usesInfura) {
      // If no Infura endpoints are used, return the state unchanged
      return state;
    }

    // Check for BSC network configuration (chainId 56 / 0x38)
    const bscNetworkConfig = networkConfigurationsByChainId[BSC_CHAIN_ID];
    if (isObject(bscNetworkConfig)) {
      const { rpcEndpoints } = bscNetworkConfig;

      if (Array.isArray(rpcEndpoints)) {
        // Find the first occurrence of "https://bsc-dataseed.binance.org/"
        const index = rpcEndpoints.findIndex(
          (endpoint) =>
            isObject(endpoint) &&
            endpoint.url === 'https://bsc-dataseed.binance.org/',
        );

        if (index !== -1) {
          // Replace the URL with the new Infura URL
          rpcEndpoints[index] = {
            ...rpcEndpoints[index],
            url: `https://bsc-mainnet.infura.io/v3/${infuraProjectId}`,
          };

          // Update the configuration
          networkConfigurationsByChainId[BSC_CHAIN_ID] = {
            ...bscNetworkConfig,
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
