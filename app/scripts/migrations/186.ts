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
 * Type guard to validate if an object has a valid RPC endpoint structure with url property.
 *
 * @param object - The object to validate.
 * @returns True if the object has a valid RPC endpoint structure.
 */
function isValidRpcEndpoint(object: unknown): object is {
  url: string;
  failoverUrls?: string[];
  [key: string]: unknown;
} {
  return (
    isObject(object) &&
    hasProperty(object, 'url') &&
    typeof object.url === 'string' &&
    (!hasProperty(object, 'failoverUrls') ||
      (hasProperty(object, 'failoverUrls') &&
        Array.isArray(object.failoverUrls) &&
        object.failoverUrls.every((url) => typeof url === 'string')))
  );
}

/**
 * Type guard to validate if an object has a valid network configuration with rpcEndpoints.
 *
 * @param object - The object to validate.
 * @returns True if the object has a valid network configuration structure.
 */
function isValidNetworkConfiguration(object: unknown): object is {
  rpcEndpoints: unknown[];
  [key: string]: unknown;
} {
  return (
    isObject(object) &&
    hasProperty(object, 'rpcEndpoints') &&
    Array.isArray(object.rpcEndpoints)
  );
}

/**
 * Type guard to validate if the state has a valid NetworkController with networkConfigurationsByChainId.
 *
 * @param state - The state object to validate.
 * @returns True if the state has a valid NetworkController structure.
 */
function hasValidNetworkController(
  state: Record<string, unknown>,
): state is Record<string, unknown> & {
  NetworkController: {
    networkConfigurationsByChainId: Record<string, unknown>;
  };
} {
  return (
    hasProperty(state, 'NetworkController') &&
    isObject(state.NetworkController) &&
    hasProperty(state.NetworkController, 'networkConfigurationsByChainId') &&
    isObject(state.NetworkController.networkConfigurationsByChainId)
  );
}

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
    if (hasValidNetworkController(versionedData.data)) {
      transformState(versionedData.data);
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

function transformState(
  state: Record<string, unknown> & {
    NetworkController: {
      networkConfigurationsByChainId: Record<string, unknown>;
    };
  },
): void {
  const { networkConfigurationsByChainId } = state.NetworkController;

  // Get Monad network configuration
  const monadNetworkConfiguration =
    networkConfigurationsByChainId[MONAD_CHAIN_ID];

  if (!monadNetworkConfiguration) {
    // Monad network doesn't exist, nothing to migrate
    return;
  }

  if (!isValidNetworkConfiguration(monadNetworkConfiguration)) {
    // Invalid network configuration structure - log to Sentry as this is unexpected
    captureException(
      new Error(
        `Migration ${version}: Monad network configuration has invalid rpcEndpoints structure.`,
      ),
    );
    return;
  }

  // Update RPC endpoints to add failover URL if needed
  monadNetworkConfiguration.rpcEndpoints =
    monadNetworkConfiguration.rpcEndpoints.map((rpcEndpoint) => {
      if (!isValidRpcEndpoint(rpcEndpoint)) {
        // Skip invalid endpoints - this is expected for some edge cases
        return rpcEndpoint;
      }

      // Skip if endpoint already has failover URLs
      if (
        rpcEndpoint.failoverUrls &&
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
}
