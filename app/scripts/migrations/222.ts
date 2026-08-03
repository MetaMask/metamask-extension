import { RpcEndpointType } from '@metamask/network-controller';
import {
  getErrorMessage,
  hasProperty,
  Hex,
  isHexString,
  isObject,
} from '@metamask/utils';
import { cloneDeep } from 'lodash';
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

export const version = 222;

export const BSC_CHAIN_ID: Hex = '0x38';
export const ZKSYNC_ERA_CHAIN_ID: Hex = '0x144';
export const MEGAETH_CHAIN_ID: Hex = '0x10e6';
export const TEMPO_CHAIN_ID: Hex = '0x1079';

const TEMPO_DEFAULT_RPC_HOST = 'rpc.tempo.xyz';

/**
 * The set of networks that got new QuickNode failovers configured in
 * INFRA-3736. For each one we add the QuickNode failover URL to the matching
 * RPC endpoints in the user's existing network configuration.
 *
 * - BSC, ZKsync Era and MegaETH default to Infura, so we only add the failover
 * to their Infura endpoints (same behaviour as the Monad/HyperEVM migrations).
 * - Tempo defaults to its own `rpc.tempo.xyz` Custom endpoint (it is not on
 * Infura). The network controller applies `failoverUrls` to Custom endpoints
 * too, so we add the failover to the Tempo default endpoint.
 */
const FAILOVER_CONFIGS: {
  chainId: Hex;
  getQuickNodeUrl: () => string | undefined;
  shouldAddFailover: (rpcEndpoint: RpcEndpoint) => boolean;
}[] = [
  {
    chainId: BSC_CHAIN_ID,
    getQuickNodeUrl: () => process.env.QUICKNODE_BSC_URL,
    shouldAddFailover: isInfuraEndpoint,
  },
  {
    chainId: ZKSYNC_ERA_CHAIN_ID,
    getQuickNodeUrl: () => process.env.QUICKNODE_ZKSYNC_URL,
    shouldAddFailover: isInfuraEndpoint,
  },
  {
    chainId: MEGAETH_CHAIN_ID,
    getQuickNodeUrl: () => process.env.QUICKNODE_MEGAETH_URL,
    shouldAddFailover: isInfuraEndpoint,
  },
  {
    chainId: TEMPO_CHAIN_ID,
    getQuickNodeUrl: () => process.env.QUICKNODE_TEMPO_URL,
    shouldAddFailover: isTempoDefaultEndpoint,
  },
];

/**
 * This migration adds the QuickNode failover URLs (configured in INFRA-3736)
 * to the BSC, ZKsync Era, MegaETH and Tempo network configurations for users
 * who already have those networks. Users adding the networks for the first
 * time already get the failover from `FEATURED_RPCS`, so this migration only
 * backfills existing configurations.
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
    // Missing or invalid NetworkController state is expected during some tests,
    // so we skip the migration silently to avoid new baseline violations.
    return state;
  }

  const { networkConfigurationsByChainId } = networkControllerState;

  for (const {
    chainId,
    getQuickNodeUrl,
    shouldAddFailover,
  } of FAILOVER_CONFIGS) {
    if (!hasProperty(networkConfigurationsByChainId, chainId)) {
      // User doesn't have this network, nothing to migrate for it.
      continue;
    }

    const networkConfiguration = networkConfigurationsByChainId[chainId];

    if (!isValidNetworkConfiguration(networkConfiguration)) {
      console.warn(
        `Migration ${version}: Invalid network configuration for chainId ${chainId}, skip it`,
      );
      continue;
    }

    const quickNodeUrl = getQuickNodeUrl();
    if (!quickNodeUrl) {
      // No failover URL available at build time, nothing to add for this network.
      continue;
    }

    const didChange = addFailoverToNetworkConfiguration(
      networkConfiguration,
      quickNodeUrl,
      shouldAddFailover,
    );

    if (didChange) {
      changedLocalChangedControllers.add('NetworkController');
    }
  }

  return state;
}

/**
 * Adds the QuickNode failover URL to the matching RPC endpoints of a network
 * configuration.
 *
 * @param networkConfiguration - The network configuration to update in place.
 * @param quickNodeUrl - The QuickNode failover URL to add.
 * @param shouldAddFailover - Predicate deciding whether a given endpoint should
 * receive the failover.
 * @returns True if at least one endpoint was updated.
 */
function addFailoverToNetworkConfiguration(
  networkConfiguration: NetworkConfiguration,
  quickNodeUrl: string,
  shouldAddFailover: (rpcEndpoint: RpcEndpoint) => boolean,
): boolean {
  let didChange = false;

  networkConfiguration.rpcEndpoints = networkConfiguration.rpcEndpoints.map(
    (rpcEndpoint) => {
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

      if (!shouldAddFailover(rpcEndpoint)) {
        return rpcEndpoint;
      }

      didChange = true;
      return {
        ...rpcEndpoint,
        failoverUrls: [quickNodeUrl],
      };
    },
  );

  return didChange;
}

/**
 * Checks if an RPC endpoint is the Tempo default endpoint (`rpc.tempo.xyz`).
 *
 * @param rpcEndpoint - The RPC endpoint to check.
 * @param rpcEndpoint.url
 * @returns True if the endpoint is the Tempo default endpoint.
 */
function isTempoDefaultEndpoint(rpcEndpoint: { url: string }): boolean {
  try {
    return new URL(rpcEndpoint.url).host === TEMPO_DEFAULT_RPC_HOST;
  } catch {
    return false;
  }
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
