import { getErrorMessage, hasProperty, Hex, isObject } from '@metamask/utils';
import { captureException } from '../../../shared/lib/sentry';
import { CHAIN_IDS } from '../../../shared/constants/network';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

export const version = 186;

const MONAD_CHAIN_ID: Hex = CHAIN_IDS.MONAD;

/**
 * This migration adds QuickNode failover URL to Monad network RPC endpoints
 * that use Infura and don't already have a failover URL configured.
 *
 * @param versionedData - The versioned MetaMask extension state to mutate in place.
 * @param changedControllers - Set of controller keys that have been changed.
 */
export async function migrate(
  versionedData: VersionedData,
  changedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;

  try {
    transformState(versionedData.data);
    // Track that NetworkController was changed
    if (hasProperty(versionedData.data, 'NetworkController')) {
      changedControllers.add('NetworkController');
    }
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
    // Re-throw to let the migrator handle the error
    throw newError;
  }
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

  // Get Monad network configuration
  const monadNetworkConfiguration =
    networkConfigurationsByChainId[MONAD_CHAIN_ID];

  if (!monadNetworkConfiguration) {
    // Monad network doesn't exist, nothing to migrate
    return state;
  }

  if (
    !isObject(monadNetworkConfiguration) ||
    !hasProperty(monadNetworkConfiguration, 'rpcEndpoints') ||
    !Array.isArray(monadNetworkConfiguration.rpcEndpoints)
  ) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: Monad network configuration has invalid rpcEndpoints.`,
      ),
    );
    return state;
  }

  // Update RPC endpoints to add failover URL if needed
  monadNetworkConfiguration.rpcEndpoints =
    monadNetworkConfiguration.rpcEndpoints.map((rpcEndpoint) => {
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
      const quickNodeUrl = process.env.QUICKNODE_MONAD_URL;
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
