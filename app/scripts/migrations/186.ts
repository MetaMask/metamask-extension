import { getErrorMessage, hasProperty, isObject } from '@metamask/utils';
import { RpcEndpointType } from '@metamask/network-controller';
import { cloneDeep } from 'lodash';
import { v4 as uuidV4 } from 'uuid';
import { captureException } from '../../../shared/lib/sentry';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const monadTestnetChainId = '0x279f'; // 10143

export const version = 186;

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

  try {
    transformState(versionedData.data);
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work
    versionedData.data = originalVersionedData.data;
  }

  return versionedData;
}

function transformState(state: Record<string, unknown>) {
  if (!hasProperty(state, 'NetworkController')) {
    captureException(
      new Error(`Migration ${version}: NetworkController not found.`),
    );
    return state;
  }

  const networkState = state.NetworkController;
  if (!isObject(networkState)) {
    captureException(
      new Error(
        `Migration ${version}: NetworkController is not an object: ${typeof networkState}`,
      ),
    );
    return state;
  }

  if (!hasProperty(networkState, 'networkConfigurationsByChainId')) {
    captureException(
      new Error(
        `Migration ${version}: NetworkController missing property networkConfigurationsByChainId.`,
      ),
    );
    return state;
  }

  if (!isObject(networkState.networkConfigurationsByChainId)) {
    captureException(
      new Error(
        `Migration ${version}: NetworkController.networkConfigurationsByChainId is not an object: ${typeof networkState.networkConfigurationsByChainId}.`,
      ),
    );
    return state;
  }

  const { networkConfigurationsByChainId } = networkState;

  // Only add the Infura RPC endpoint if the Monad Testnet network configuration is already present
  if (
    hasProperty(networkConfigurationsByChainId, monadTestnetChainId) &&
    isObject(networkConfigurationsByChainId[monadTestnetChainId])
  ) {
    const monadTestnetConfiguration =
      networkConfigurationsByChainId[monadTestnetChainId];
    if (
      isObject(monadTestnetConfiguration) &&
      hasProperty(monadTestnetConfiguration, 'rpcEndpoints') &&
      Array.isArray(monadTestnetConfiguration.rpcEndpoints)
    ) {
      const isInfuraRpcEndpointExist =
        monadTestnetConfiguration.rpcEndpoints.find((rpcEndpoint) => {
          return (
            isObject(rpcEndpoint) &&
            hasProperty(rpcEndpoint, 'url') &&
            typeof rpcEndpoint.url === 'string' &&
            rpcEndpoint.url.includes('monad-testnet.infura.io')
          );
        });

      // If there are no Infura RPC endpoints, add the Infura RPC endpoint to the Monad Testnet network configuration
      if (!isInfuraRpcEndpointExist) {
        // Add the Infura RPC endpoint to the Monad Testnet network configuration
        monadTestnetConfiguration.rpcEndpoints.push({
          url: 'https://monad-testnet.infura.io/v3/{infuraProjectId}',
          type: RpcEndpointType.Infura,
          networkClientId: uuidV4(),
        });
        // Update the default RPC endpoint index to the new Infura RPC endpoint
        monadTestnetConfiguration.defaultRpcEndpointIndex =
          monadTestnetConfiguration.rpcEndpoints.length - 1;
      }
    }
  }

  return state;
}
