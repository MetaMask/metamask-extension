import { RpcEndpointType } from '@metamask/network-controller';
import {
  getErrorMessage,
  hasProperty,
  Hex,
  isHexString,
  isObject,
} from '@metamask/utils';
import { cloneDeep } from 'lodash';
import { v4 } from 'uuid';
import { captureException } from '../../../shared/lib/sentry';
import { infuraProjectId } from '../../../shared/constants/network';

export type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

/**
 * A Copy of the RpcEndpoint type from the network controller,
 * This is used to avoid the dependency on the network controller.
 */
type RpcEndpoint = {
  failoverUrls?: string[];
  name?: string;
  networkClientId: string;
  url: string;
  type: string;
};

/**
 * A Copy of the NetworkConfiguration type from the network controller,
 * This is used to avoid the dependency on the network controller.
 */
type NetworkConfiguration = {
  blockExplorerUrls: string[];
  chainId: Hex;
  defaultBlockExplorerUrlIndex?: number;
  defaultRpcEndpointIndex: number;
  name: string;
  nativeCurrency: string;
  rpcEndpoints: RpcEndpoint[];
};

export const version = 197;

export const HYPEREVM_CHAIN_ID: string = '0x3e7';

/**
 * This migration does:
 * - For users NOT already having the HyperEVM network: When HyperEVM is added for the first time, it will already use
 * Infura RPC with a Quicknode failover, so this migration will have no effect.
 * - For users ALREADY having the HyperEVM network: The network may or may not already have Infura RPC, and failover.
 * -> If the user has a non-Infura RPC, we ADD the Infura RPC + QuickNode failover and set it to default.
 * -> If the user has a Infura RPC without failover, we add the QuickNode failover to that Infura RPC.
 *
 * @param versionedData - Versioned MetaMask extension state, exactly
 * what we persist to disk.
 * @param localChangedControllers - A set of controller keys that have been changed by the migration.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  versionedData: VersionedData,
  localChangedControllers: Set<string>,
): Promise<void> {
  versionedData.meta.version = version;
  const changedVersionedData = cloneDeep(versionedData);
  const changedLocalChangedControllers = new Set<string>();

  try {
    transformState(changedVersionedData.data, changedLocalChangedControllers);
    versionedData.data = changedVersionedData.data;
    changedLocalChangedControllers.forEach((controller) =>
      localChangedControllers.add(controller),
    );
  } catch (error) {
    console.error(error);
    const newError = new Error(
      `Migration #${version}: ${getErrorMessage(error)}`,
    );
    captureException(newError);
    // Even though we encountered an error, we need the migration to pass for
    // the migrator tests to work
  }
}

function transformState(
  state: Record<string, unknown>,
  changedLocalChangedControllers: Set<string>,
) {
  const networkControllerState = validateNetworkController(state);
  if (networkControllerState === undefined) {
    // There used to be a warning "Migration 197: Missing or invalid NetworkController state, skip the migration"
    // But it is expected during some tests and caused new baseline violations se we removed it.
    return state;
  }

  const { networkConfigurationsByChainId } = networkControllerState;
  // Migrate NetworkController:
  // - Migrates the HyperEVM Mainnet network configuration if user already has it.
  if (hasProperty(networkConfigurationsByChainId, HYPEREVM_CHAIN_ID)) {
    const hyperevmMainnetConfiguration =
      networkConfigurationsByChainId[HYPEREVM_CHAIN_ID];

    if (!isValidNetworkConfiguration(hyperevmMainnetConfiguration)) {
      console.warn(
        `Migration ${version}: Invalid HyperEVM network configuration, skip the migration`,
      );
      return state;
    }

    mergeHyperevmNetworkConfiguration(hyperevmMainnetConfiguration);
    changedLocalChangedControllers.add('NetworkController');
  }

  return state;
}

function mergeHyperevmNetworkConfiguration(
  hyperevmMainnetConfiguration: NetworkConfiguration,
) {
  // If the Infura Project ID is set and the same RPC doesn't already exist, we add it and set by default
  if (infuraProjectId) {
    const newInfuraURL = `https://hyperevm-mainnet.infura.io/v3/${infuraProjectId}`;
    const isInfuraRpcPresent = hyperevmMainnetConfiguration.rpcEndpoints.find(
      (rpc) => rpc.url === newInfuraURL,
    );
    // Avoid RPC duplication if Infura is already present.
    if (!isInfuraRpcPresent) {
      hyperevmMainnetConfiguration.rpcEndpoints.push({
        failoverUrls: [],
        // For networkClientId and type, we stick to 'custom' for now for consistency.
        // This is because "InfuraNetworkType" has this network missing if done now
        // and because other Infura networks use 'custom' types as of now.
        // Planning to run a dedicated migration script for set all infura RPCs to 'infura' type.
        // Dicussion: https://github.com/MetaMask/metamask-extension/pull/39635#issuecomment-3861983789
        networkClientId: v4(),
        type: 'custom',
        url: newInfuraURL,
      });
      hyperevmMainnetConfiguration.defaultRpcEndpointIndex =
        hyperevmMainnetConfiguration.rpcEndpoints.length - 1;
    }
  } else {
    captureException(
      new Error(
        `Migration ${version}: Infura project ID is not set, skip the HyperEVM RPC part of the migration`,
      ),
    );
  }

  // Update RPC endpoints to add failover URL if needed
  hyperevmMainnetConfiguration.rpcEndpoints =
    hyperevmMainnetConfiguration.rpcEndpoints.map((rpcEndpoint) => {
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

      // Only add failover URL to Infura endpoints
      if (!isInfuraEndpoint(rpcEndpoint)) {
        return rpcEndpoint;
      }

      // Add QuickNode failover URL
      const quickNodeUrl = process.env.QUICKNODE_HYPEREVM_URL;
      if (quickNodeUrl) {
        return {
          ...rpcEndpoint,
          failoverUrls: [quickNodeUrl],
        };
      }

      return rpcEndpoint;
    });
}

// From Monad migration script (188.ts)
function validateNetworkController(state: Record<string, unknown>):
  | {
      networkConfigurationsByChainId: Record<Hex, unknown>;
      selectedNetworkClientId: string;
    }
  | undefined {
  if (!hasProperty(state, 'NetworkController')) {
    // We catch the exception here, as we don't expect the NetworkController state is missing.
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: missing NetworkController`,
      ),
    );
    return undefined;
  }

  const networkControllerState = state.NetworkController;

  // To narrow the type of the networkControllerState to the expected type.
  if (!isValidNetworkControllerState(networkControllerState)) {
    return undefined;
  }

  return networkControllerState;
}

// From Monad migration script (188.ts)
function isValidNetworkControllerState(value: unknown): value is {
  networkConfigurationsByChainId: Record<Hex, unknown>;
  selectedNetworkClientId: string;
} {
  if (!isObject(value)) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: NetworkController state is not an object: '${typeof value}'`,
      ),
    );
    return false;
  }

  if (!hasProperty(value, 'networkConfigurationsByChainId')) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: missing networkConfigurationsByChainId property`,
      ),
    );
    return false;
  }

  if (
    !isValidNetworkConfigurationsByChainId(value.networkConfigurationsByChainId)
  ) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: networkConfigurationsByChainId is not a valid Record<Hex, unknown>`,
      ),
    );
    return false;
  }

  if (!hasProperty(value, 'selectedNetworkClientId')) {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: missing selectedNetworkClientId property`,
      ),
    );
    return false;
  }

  if (typeof value.selectedNetworkClientId !== 'string') {
    captureException(
      new Error(
        `Migration ${version}: Invalid NetworkController state: selectedNetworkClientId is not a string: '${typeof value.selectedNetworkClientId}'`,
      ),
    );
    return false;
  }

  return true;
}

// From Monad migration script (188.ts)
function isValidNetworkConfigurationsByChainId(
  value: unknown,
): value is Record<Hex, unknown> {
  return (
    isObject(value) &&
    Object.entries(value).every(
      ([chainId]) => typeof chainId === 'string' && isHexString(chainId),
    )
  );
}

// From Monad migration script (188.ts)
function isValidNetworkConfiguration(
  object: unknown,
): object is NetworkConfiguration {
  return (
    isObject(object) &&
    hasProperty(object, 'chainId') &&
    typeof object.chainId === 'string' &&
    isHexString(object.chainId) &&
    hasProperty(object, 'rpcEndpoints') &&
    Array.isArray(object.rpcEndpoints) &&
    object.rpcEndpoints.every(isValidRpcEndpoint) &&
    hasProperty(object, 'name') &&
    typeof object.name === 'string' &&
    hasProperty(object, 'nativeCurrency') &&
    typeof object.nativeCurrency === 'string' &&
    hasProperty(object, 'blockExplorerUrls') &&
    Array.isArray(object.blockExplorerUrls) &&
    object.blockExplorerUrls.every((url) => typeof url === 'string') &&
    hasProperty(object, 'defaultRpcEndpointIndex') &&
    typeof object.defaultRpcEndpointIndex === 'number' &&
    (!hasProperty(object, 'defaultBlockExplorerUrlIndex') ||
      (hasProperty(object, 'defaultBlockExplorerUrlIndex') &&
        typeof object.defaultBlockExplorerUrlIndex === 'number'))
  );
}

/**
 * Type guard to validate if an object has a valid RPC endpoint structure with url property.
 *
 * @param object - The object to validate.
 * @returns True if the object has a valid RPC endpoint structure.
 */
// From Monad migration script (188.ts)
function isValidRpcEndpoint(object: unknown): object is {
  url: string;
  type?: RpcEndpointType;
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
 * Checks if an RPC endpoint is an Infura endpoint.
 *
 * @param rpcEndpoint - The RPC endpoint to check.
 * @param rpcEndpoint.url - The URL of the RPC endpoint.
 * @param rpcEndpoint.type - The type of the RPC endpoint (optional).
 * @returns True if the endpoint is an Infura endpoint.
 */
// From Monad migration script (188.ts)
function isInfuraEndpoint(rpcEndpoint: {
  url: string;
  type?: RpcEndpointType;
  [key: string]: unknown;
}): boolean {
  // Check if type is explicitly Infura
  if (rpcEndpoint.type === RpcEndpointType.Infura) {
    return true;
  }

  // Check if URL matches Infura pattern
  // All featured networks that use Infura get added as custom RPC
  // endpoints, not Infura RPC endpoints, so we need to check the URL pattern
  const infuraUrlPattern = /^https:\/\/(.+?)\.infura\.io\/v3\//u;
  const match = rpcEndpoint.url.match(infuraUrlPattern);

  if (!match) {
    return false;
  }

  // If INFURA_PROJECT_ID is set, verify it matches for more precise detection
  if (infuraProjectId) {
    const expectedUrl = `https://${match[1]}.infura.io/v3/${infuraProjectId}`;
    return rpcEndpoint.url.startsWith(expectedUrl);
  }

  // If INFURA_PROJECT_ID is not set, just check if it matches the Infura pattern
  return true;
}
