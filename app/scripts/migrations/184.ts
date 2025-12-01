import { cloneDeep } from 'lodash';
import { v4 as uuidV4 } from 'uuid';
import { RpcEndpointType } from '@metamask/network-controller';
import { hasProperty, isObject } from '@metamask/utils';
import { CHAIN_IDS } from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 183;

/**
 * This migration add Monad Testnet Infura RPC to
 * networkConfigurationsByChainId if they are not already present.
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
  if (!hasProperty(state, 'NetworkController')) {
    console.warn(`Migration ${version}: NetworkController not found.`);
    return state;
  }

  const networkState = state.NetworkController;
  if (!isObject(networkState)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController is not an object: ${typeof networkState}`,
      ),
    );
    return state;
  }

  if (!hasProperty(networkState, 'networkConfigurationsByChainId')) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController missing property networkConfigurationsByChainId.`,
      ),
    );
    return state;
  }

  if (!isObject(networkState.networkConfigurationsByChainId)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is not an object: ${typeof networkState.networkConfigurationsByChainId}.`,
      ),
    );
    return state;
  }

  const existingNetworkConfigurations =
    networkState.networkConfigurationsByChainId;

  const monadTestnetChainId = CHAIN_IDS.MONAD_TESTNET;
  const monadTestnetConfiguration = existingNetworkConfigurations[monadTestnetChainId];
  // Only add the Infura RPC endpoint if the Monad Testnet network configuration is already present
  if (monadTestnetConfiguration) {
    if (isObject(monadTestnetConfiguration) && hasProperty(monadTestnetConfiguration, 'rpcEndpoints') && Array.isArray(monadTestnetConfiguration.rpcEndpoints)) {
      // Filter out the Infura RPC endpoints
      const infuraRpcEndpoints = monadTestnetConfiguration.rpcEndpoints.filter((rpcEndpoint) => {
        return (isObject(rpcEndpoint) && hasProperty(rpcEndpoint, 'url') && typeof rpcEndpoint.url === 'string' && rpcEndpoint.url.includes('monad-testnet.infura.io'))
      });

      // If there are no Infura RPC endpoints, add the Infura RPC endpoint to the Monad Testnet network configuration
      if (infuraRpcEndpoints.length === 0) {
        // Add the Infura RPC endpoint to the Monad Testnet network configuration
        monadTestnetConfiguration.rpcEndpoints.push({
          url: 'https://monad-testnet.infura.io/v3/{infuraProjectId}',
          // We have to use Custom type for this migration,
          // Because the controller utils is not yet updated to support Monad Testnet as Infura type
          type: RpcEndpointType.Custom,
          networkClientId: uuidV4(),
        });
        // Update the default RPC endpoint index to the new Infura RPC endpoint
        monadTestnetConfiguration.defaultRpcEndpointIndex = monadTestnetConfiguration.rpcEndpoints.length - 1;
      }
    }
  }

  return state;
}
