import { getErrorMessage, hasProperty, Hex, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { captureException } from '../../../shared/lib/sentry';
import { CHAIN_IDS } from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 183;

const SEI_CHAIN_ID: Hex = CHAIN_IDS.SEI;

/**
 * This migration adds QuickNode failover URL to Sei network RPC endpoints
 * that use Infura and don't already have a failover URL configured.
 *
 * @param originalVersionedData - The original MetaMask extension state.
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

  const { networkConfigurationsByChainId } = networkState;

  // Get Sei network configuration
  const seiNetworkConfiguration = networkConfigurationsByChainId[SEI_CHAIN_ID];

  if (!seiNetworkConfiguration) {
    // Sei network doesn't exist, nothing to migrate
    return state;
  }

  if (
    !isObject(seiNetworkConfiguration) ||
    !hasProperty(seiNetworkConfiguration, 'rpcEndpoints') ||
    !Array.isArray(seiNetworkConfiguration.rpcEndpoints)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Sei network configuration has invalid rpcEndpoints.`,
      ),
    );
    return state;
  }

  // Update RPC endpoints to add failover URL if needed
  seiNetworkConfiguration.rpcEndpoints =
    seiNetworkConfiguration.rpcEndpoints.map((rpcEndpoint) => {
      // Skip if endpoint is not an object or doesn't have a url property
      if (
        !isObject(rpcEndpoint) ||
        !hasProperty(rpcEndpoint, 'url') ||
        typeof rpcEndpoint.url !== 'string'
      ) {
        return rpcEndpoint;
      }

      // Skip if endpoint already has failover URLs
      if (
        hasProperty(rpcEndpoint, 'failoverUrls') &&
        Array.isArray(rpcEndpoint.failoverUrls) &&
        rpcEndpoint.failoverUrls.length > 0
      ) {
        return rpcEndpoint;
      }

      // Add QuickNode failover URL
      const quickNodeUrl = process.env.QUICKNODE_SEI_URL;
      if (quickNodeUrl) {
        return {
          ...rpcEndpoint,
          failoverUrls: [quickNodeUrl],
        };
      }

      return rpcEndpoint;
    });

  return state;
}
